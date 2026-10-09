/* ------------------------------------------------------------------
   送料と発送先。**送料の正本はここ一つ** —— 決済（checkout/actions.ts）・作品ページと一覧の
   表記・特商法の表記（data/site.ts の legal.shipping）・構造化データ（lib/seo.ts）が読む。
   サーバ専用ではない（data/site.ts から読めるように）。
   ------------------------------------------------------------------ */

/**
 * 国際発送の送料（AUD、一注文あたり）。0 にすると「送料込み」で、決済に送料の行が出なくなる。
 *
 * 2026-10-09 に A$40 で確定（本人）。作品ごとに変える作りにはしていない（一箱一点で、
 * 重さの差が送料の段に届かないため）。
 */
export const SHIPPING_AUD = 40;

/** Checkout に出す国。発送できない国を選ばせないための一覧。 */
export const SHIPPING_COUNTRIES = ["AU", "NZ", "JP", "SG", "US", "CA", "GB"] as const;

/** その品々の決済にかかる送料。試し買い用（data/products.ts の test）だけなら 0。 */
export function shippingFor(pieces: readonly { test?: boolean }[]): number {
  return pieces.length > 0 && pieces.every((p) => p.test) ? 0 : SHIPPING_AUD;
}
