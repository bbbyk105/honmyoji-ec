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

  try {
    const { data, error } = await client.from("piece_overrides").select("*");
    if (error) throw error;
    const map = new Map<string, Override>();
    for (const row of data ?? []) {
      const o = toOverride(row as Record<string, unknown>);
      if (o) map.set(o.slug, o);
    }
    return map;
  } catch (error) {
    console.error("[studio] piece_overrides の読み込みに失敗 — data/products.ts の値で表示します", error);
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
