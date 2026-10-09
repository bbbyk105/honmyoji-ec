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

   **何度呼んでも同じ結果になる**（Webhook の再送でもう一度呼ばれる）。完売にした決済を
   `sold_session` に残し、「もう完売」の作品のうち自分の決済で完売にしたものは取り違えに
   数えない —— 前の配達が途中まで進んでから落ちても、再送で誤って二重販売と言わない。
   ------------------------------------------------------------------ */

type Blocking = Extract<ProductStatus, "sold_out" | "reserved">;

export type SoldClash = { slug: string; status: Blocking };

const isBlocking = (status: unknown): status is Blocking => status === "sold_out" || status === "reserved";

/** 行が無い・status が空 = コード側（data/products.ts）の状態。 */
const codeStatus = (slug: string): ProductStatus | undefined => getProduct(slug)?.status;

export async function markSold(
  client: PostgrestClient,
  slugs: string[],
  now: string,
  /** この決済（Stripe の Checkout Session の ID）。完売にした決済として残す */
  sessionId: string,
): Promise<SoldClash[]> {
  if (slugs.length === 0) return [];
  const clashes: SoldClash[] = [];
  const sold = { status: "sold_out", updated_at: now, sold_session: sessionId };

  // 1. 行があり、売れていない（完売でも取り置きでもない）ものを完売に。status が空の行は 3 へ
  const first = await client
    .from("piece_overrides")
    .update(sold)
    .in("slug", slugs)
    .not("status", "in", "(sold_out,reserved)")
    .select("slug");
  if (first.error) throw first.error;
  const done = new Set((first.data ?? []).map((row) => row.slug as string));

  // 2. 行が無いものは作る。同時に作られたら後の方は 0 件になり 3 へ回る
  const missing = slugs.filter((slug) => !done.has(slug));
  if (missing.length > 0) {
    const second = await client
      .from("piece_overrides")
      .upsert(
        missing.map((slug) => ({ slug, ...sold })),
        { onConflict: "slug", ignoreDuplicates: true },
      )
      .select("slug");
    if (second.error) throw second.error;
    for (const row of second.data ?? []) {
      const slug = row.slug as string;
      done.add(slug);
      const code = codeStatus(slug);
      if (isBlocking(code)) clashes.push({ slug, status: code });
    }
  }

  // 3. 残りは行があって、status が空か、もう完売・取り置きだったもの
  const rest = slugs.filter((slug) => !done.has(slug));
  if (rest.length > 0) {
    // 3a. status が空（= コード側の状態）の行。コード側で完売・取り置きなら取り違え
    const third = await client
      .from("piece_overrides")
      .update(sold)
      .in("slug", rest)
      .is("status", null)
      .select("slug");
    if (third.error) throw third.error;
    for (const row of third.data ?? []) {
      const slug = row.slug as string;
      done.add(slug);
      const code = codeStatus(slug);
      if (isBlocking(code)) clashes.push({ slug, status: code });
    }

    // 3b. もう完売・取り置きだった。この決済が前の配達で完売にしたもの（sold_session が同じ）は
    //     取り違えではない。それ以外は決済の前にもう買えなかった作品。取り置きはお金が入ったので完売に
    const taken = rest.filter((slug) => !done.has(slug));
    if (taken.length > 0) {
      const current = await client.from("piece_overrides").select("slug,status,sold_session").in("slug", taken);
      if (current.error) throw current.error;
      for (const row of current.data ?? []) {
        if (row.sold_session === sessionId) continue;
        clashes.push({ slug: row.slug as string, status: isBlocking(row.status) ? row.status : "sold_out" });
      }
      const settle = await client.from("piece_overrides").update(sold).in("slug", taken).eq("status", "reserved");
      if (settle.error) throw settle.error;
    }
  }

  return clashes;
}
