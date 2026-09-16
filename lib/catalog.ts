import { cache } from "react";

import { db } from "@/lib/supabase";
import { products, type Product, type ProductStatus } from "@/data/products";

/* ------------------------------------------------------------------
   商品カタログ = data/products.ts + DB のオーバーレイ。
   **サーバ専用**（`db()` を経由するため）。

   正本はコードのまま。DB にあるのは管理画面から動かしたい値だけで、行が無い
   ものは products.ts の値がそのまま出る。DB が落ちても鍵が無くても、サイトは
   今日と同じ姿で立つ —— 管理画面のために公開ページを人質に取らない。
   ------------------------------------------------------------------ */

const STATUSES: ProductStatus[] = ["available", "made_to_order", "reserved", "sold_out", "coming_soon"];

/**
 * DB を待つ上限。健全な Supabase なら九行の select は 0.3 秒もかからない。
 *
 * supabase-js は fetch が失敗すると内部で数回やり直す。ホストごと消えていると
 * その再試行が 7 秒かかり、SiteChrome が getCatalog() を呼ぶので**公開ページ全部**
 * がその 7 秒を払うことになる（2026-09-16 に実際に踏んだ）。落ちている DB を
 * 待つ時間は、コード側の値で出せると分かっている以上ただの無駄。
 */
const DB_TIMEOUT_MS = 2000;

/**
 * 一度失敗したらしばらく叩きに行かない。DB が落ちている間、訪問者全員に
 * 2 秒ずつ払わせる理由が無い。復旧は次の窓で拾う（公開ページの revalidate は
 * 600 秒なので、30 秒の遅れは見えない）。
 */
const DB_COOLDOWN_MS = 30_000;

/** 直近の失敗から DB を休ませる期限。0 なら平常。 */
let coolUntil = 0;

/**
 * 落ちている間ずっと同じ一行を吐かないための印。落ちた最初と、戻った瞬間だけ
 * 知らせる。30 秒ごとに同じ警告が流れると、本当に見たいログが埋もれる。
 */
let degraded = false;

/**
 * ログに出す一行。supabase-js のエラーは message に Cloudflare の 521 ページが
 * 丸ごと入ってくることがあるので、改行を潰して頭だけ拾う（2026-09-16 に実際に
 * 踏んだ —— 端末が HTML で埋まった）。
 */
function describe(error: unknown): string {
  const line = raw(error).replace(/\s+/g, " ").trim();
  if (!line || line === "{}") return "原因不明";
  return line.length > 140 ? `${line.slice(0, 140)}…` : line;
}

function raw(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const { message } = error as { message?: unknown };
    if (typeof message === "string" && message) return message;
    // supabase-js の PostgrestError は素のオブジェクト。String() だと
    // [object Object] になって何も分からない。
    try {
      return JSON.stringify(error);
    } catch {
      return "";
    }
  }
  return String(error);
}

export type Override = {
  slug: string;
  price_aud: number | null;
  status: ProductStatus | null;
  note: string | null;
  note_ja: string | null;
  story: string | null;
  story_ja: string | null;
  updated_at: string;
};

function isStatus(v: unknown): v is ProductStatus {
  return typeof v === "string" && (STATUSES as string[]).includes(v);
}

/** DB の一行。壊れた値（不正な status など）は無かったことにして落ちない。 */
function toOverride(row: Record<string, unknown>): Override | null {
  const slug = typeof row.slug === "string" ? row.slug : "";
  if (!slug) return null;
  const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  return {
    slug,
    price_aud: typeof row.price_aud === "number" && row.price_aud > 0 ? row.price_aud : null,
    status: isStatus(row.status) ? row.status : null,
    note: text(row.note),
    note_ja: text(row.note_ja),
    story: text(row.story),
    story_ja: text(row.story_ja),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : "",
  };
}

/**
 * オーバーレイを slug 引きで。管理画面は「コード側の値」と「上書きした値」を
 * 並べて見せたいので、合成前のこれも要る。
 */
export const getOverrides = cache(async (): Promise<Map<string, Override>> => {
  const client = db();
  const empty = new Map<string, Override>();
  if (!client) return empty;

  // 落ちていると分かっている間は、待たずにコード側の値へ。
  if (Date.now() < coolUntil) return empty;

  try {
    const { data, error } = await client
      .from("piece_overrides")
      .select("*")
      .abortSignal(AbortSignal.timeout(DB_TIMEOUT_MS));
    if (error) throw error;
    const map = new Map<string, Override>();
    for (const row of data ?? []) {
      const o = toOverride(row as Record<string, unknown>);
      if (o) map.set(o.slug, o);
    }
    coolUntil = 0;
    if (degraded) {
      degraded = false;
      console.info("[studio] piece_overrides に再接続しました");
    }
    return map;
  } catch (error) {
    coolUntil = Date.now() + DB_COOLDOWN_MS;
    if (!degraded) {
      degraded = true;
      // console.error にすると Next の dev オーバーレイが画面を覆う。これは
      // 設計どおりの縮退（コード側の値で出る）で、手を止める異常ではない。
      console.warn(
        `[studio] piece_overrides に繋がりません — data/products.ts の値で表示します（${DB_COOLDOWN_MS / 1000} 秒は再試行しません）: ${describe(error)}`,
      );
    }
    return empty;
  }
});

function merge(product: Product, o: Override | undefined): Product {
  if (!o) return product;
  return {
    ...product,
    priceAud: o.price_aud ?? product.priceAud,
    status: o.status ?? product.status,
    note: o.note ?? product.note,
    noteJa: o.note_ja ?? product.noteJa,
    story: o.story ?? product.story,
    storyJa: o.story_ja ?? product.storyJa,
  };
}

/** 公開ページが読むカタログ。順序は products.ts のまま（展示の並び）。 */
export const getCatalog = cache(async (): Promise<Product[]> => {
  const overrides = await getOverrides();
  if (overrides.size === 0) return products;
  return products.map((p) => merge(p, overrides.get(p.slug)));
});

/** slug でも旧 folder 名でも引ける — products.ts の getProduct と同じ約束。 */
export async function getPiece(key: string): Promise<Product | undefined> {
  const catalog = await getCatalog();
  return catalog.find((p) => p.slug === key || p.folder === key);
}

/** カートの slug 配列 → 商品。見つからない slug は落とす。 */
export async function getPieces(keys: string[]): Promise<Product[]> {
  const catalog = await getCatalog();
  return keys
    .map((k) => catalog.find((p) => p.slug === k || p.folder === k))
    .filter((p): p is Product => Boolean(p));
}

/** Stripe はセント単位。A$220 → 22000。 */
export function toCents(priceAud: number): number {
  return Math.round(priceAud * 100);
}
