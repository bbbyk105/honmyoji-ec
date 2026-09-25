import { findByKey } from "@/data/products";

/* ------------------------------------------------------------------
   カートの計算。React にも localStorage にも触らない純粋な関数だけ。
   `CartProvider` がこれを使い、テストもここを直に叩く。

   カタログは引数でもらう。以前は `data/products.ts` の `getProduct` を直に
   読んでいたので、カートを持つ全ページのバンドルに九点ぶんの物語まで入っていた。
   ------------------------------------------------------------------ */

type Keyed = { slug: string; folder: string };

/** localStorage の中身 → slug の配列。壊れていれば空（カートが開けなくなるよりまし）。 */
export function parseCart(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

/** 旧 folder 名（`sakura`）で入っているカートがあるので、書くときは slug に揃える。 */
export function canonicalSlug(catalog: readonly Keyed[], key: string): string {
  return findByKey(catalog, key)?.slug ?? key;
}

/** slug と旧 folder 名を同じ一点として比べる。 */
export function samePiece(catalog: readonly Keyed[], a: string, b: string): boolean {
  if (a === b) return true;
  const x = findByKey(catalog, a);
  const y = findByKey(catalog, b);
  return Boolean(x && y && x.slug === y.slug);
}

/** 足した後のカート。もう入っていれば null（書き込まない）。 */
export function addPiece(current: readonly string[], catalog: readonly Keyed[], key: string): string[] | null {
  const next = canonicalSlug(catalog, key);
  if (current.some((s) => samePiece(catalog, s, next))) return null;
  return [...current, next];
}

export function removePiece(current: readonly string[], catalog: readonly Keyed[], key: string): string[] {
  return current.filter((s) => !samePiece(catalog, s, key));
}

/** slug の並び → カタログの品。カタログから消えた slug は黙って落とす。 */
export function resolvePieces<T extends Keyed>(catalog: readonly T[], slugs: readonly string[]): T[] {
  return slugs.map((s) => findByKey(catalog, s)).filter((p): p is T => Boolean(p));
}
