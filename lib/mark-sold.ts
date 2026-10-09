import "server-only";

import type { PostgrestClient } from "@supabase/postgrest-js";

import { getProduct, type ProductStatus } from "@/data/products";

/* ------------------------------------------------------------------
   決済の通った作品を完売にし、**もう買えない状態だったもの**を返す（二重販売の検出）。

   以前は「先に読んで（catalog）、あとで書く」だった。読むのは DB が不調なら黙って
   コード側の値に落ち、同時に来た二つの Webhook はどちらも「まだ販売中」を読めた —— 二重に
   売れても警告が出ない（監査 11）。ここでは書き込みそのものに条件を付ける。「まだ売れて
   いない行だけ完売にする」update は行の鍵で順番になるので、後から来た方は 0 件になる。
   その 0 件になった作品が、取り違えた作品。DB に届かなければ投げる（Webhook は 500 で再送）。

   **何度呼んでも同じ結果になる**（Webhook の再送でもう一度呼ばれる）。この決済で完売にした
   作品だけ `sold_session` に決済の ID を残し、二重販売だった作品には残さない。再送で「もう完売」を
   見たとき、自分の ID が付いていれば前の配達の続き（取り違えではない）、付いていなければ
   取り違え —— 前の配達が途中まで進んでから落ちても、判定は変わらない。
   ------------------------------------------------------------------ */

type Blocking = Extract<ProductStatus, "sold_out" | "reserved">;

export type SoldClash = { slug: string; status: Blocking };

const isBlocking = (status: unknown): status is Blocking => status === "sold_out" || status === "reserved";

/** 行が無い・status が空 = コード側（data/products.ts）の状態。 */
const codeStatus = (slug: string): ProductStatus | undefined => getProduct(slug)?.status;

/** 一つの決済ぶんの完売の書き込み。 */
class Sale {
  readonly clashes: SoldClash[] = [];
  private readonly done = new Set<string>();

  constructor(
    private readonly client: PostgrestClient,
    private readonly now: string,
    private readonly sessionId: string,
  ) {}

  /** この決済で売れた（印を付ける）。 */
  private ours() {
    return { status: "sold_out", updated_at: this.now, sold_session: this.sessionId };
  }

  /** 二重販売だった（完売にはするが、印は付けない —— 再送でも取り違えと判定し続けるため）。 */
  private theirs() {
    return { status: "sold_out", updated_at: this.now };
  }

  private settle(slug: string, status: Blocking | undefined) {
    this.done.add(slug);
    if (status) this.clashes.push({ slug, status });
  }

  pending(slugs: string[]): string[] {
    return slugs.filter((slug) => !this.done.has(slug));
  }

  /** 行があり、売れていない（完売でも取り置きでもない）ものを、この決済の完売に。status が空の行は含まない */
  async takeAvailable(slugs: string[]): Promise<void> {
    if (slugs.length === 0) return;
    const { data, error } = await this.client
      .from("piece_overrides")
      .update(this.ours())
      .in("slug", slugs)
      .not("status", "in", "(sold_out,reserved)")
      .select("slug");
    if (error) throw error;
    for (const row of data ?? []) this.settle(row.slug as string, undefined);
  }

  /**
   * 行が無い、または status が空（= コード側の状態）の作品。コード側で完売・取り置きなら取り違え。
   * 同時に作られていたら（別の配達）0 件になり、あとで読み直す。
   */
  async takeCodeSide(slugs: string[]): Promise<void> {
    if (slugs.length === 0) return;
    const rows = slugs.map((slug) => {
      const code = codeStatus(slug);
      return { slug, ...(isBlocking(code) ? this.theirs() : this.ours()), sold_session: isBlocking(code) ? null : this.sessionId };
    });
    const inserted = await this.client
      .from("piece_overrides")
      .upsert(rows, { onConflict: "slug", ignoreDuplicates: true })
      .select("slug");
    if (inserted.error) throw inserted.error;
    for (const row of inserted.data ?? []) {
      const code = codeStatus(row.slug as string);
      this.settle(row.slug as string, isBlocking(code) ? code : undefined);
    }

    // 行はあるが status が空（コード側の状態）
    for (const blocking of [false, true]) {
      const group = this.pending(slugs).filter((slug) => isBlocking(codeStatus(slug)) === blocking);
      if (group.length === 0) continue;
      const { data, error } = await this.client
        .from("piece_overrides")
        .update(blocking ? { ...this.theirs(), sold_session: null } : this.ours())
        .in("slug", group)
        .is("status", null)
        .select("slug");
      if (error) throw error;
      for (const row of data ?? []) {
        const code = codeStatus(row.slug as string);
        this.settle(row.slug as string, blocking && isBlocking(code) ? code : undefined);
      }
    }
  }

  /**
   * 残り: もう完売・取り置きだった作品。自分の印が付いていれば前の配達の続き。付いていなければ
   * 取り違え（取り置きはお金が入ったので完売に。印は付けない）。読んだ時点で売れていない状態なら
   * （書いてから読むまでの間に管理画面が戻した）、完売をもう一度試す。
   */
  async settleTaken(slugs: string[]): Promise<{ retry: string[] }> {
    if (slugs.length === 0) return { retry: [] };
    const current = await this.client.from("piece_overrides").select("slug,status,sold_session").in("slug", slugs);
    if (current.error) throw current.error;
    const retry: string[] = [];
    const reserved: string[] = [];
    for (const row of current.data ?? []) {
      const slug = row.slug as string;
      if (row.sold_session === this.sessionId) {
        this.settle(slug, undefined);
      } else if (isBlocking(row.status)) {
        this.settle(slug, row.status);
        if (row.status === "reserved") reserved.push(slug);
      } else {
        retry.push(slug);
      }
    }
    if (reserved.length > 0) {
      const { error } = await this.client
        .from("piece_overrides")
        .update(this.theirs())
        .in("slug", reserved)
        .eq("status", "reserved");
      if (error) throw error;
    }
    return { retry };
  }
}

export async function markSold(
  client: PostgrestClient,
  slugs: string[],
  now: string,
  /** この決済（Stripe の Checkout Session の ID）。この決済で完売にした作品の印として残す */
  sessionId: string,
): Promise<SoldClash[]> {
  if (slugs.length === 0) return [];
  const sale = new Sale(client, now, sessionId);

  await sale.takeAvailable(slugs);
  await sale.takeCodeSide(sale.pending(slugs));
  const { retry } = await sale.settleTaken(sale.pending(slugs));

  // 書いてから読むまでの間に管理画面が販売中などへ戻した作品は、もう一度だけ試す
  if (retry.length > 0) {
    await sale.takeAvailable(retry);
    await sale.takeCodeSide(sale.pending(retry));
    await sale.settleTaken(sale.pending(retry));
  }

  // それでも決まらない作品は、取り違えとして知らせる（払われたのに販売中のまま、を黙って残さない）
  for (const slug of sale.pending(slugs)) {
    console.error("[stripe] 完売にできなかった作品", slug);
    sale.clashes.push({ slug, status: "sold_out" });
  }
  return sale.clashes;
}
