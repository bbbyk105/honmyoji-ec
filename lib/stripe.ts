import Stripe from "stripe";

/* ------------------------------------------------------------------
   Stripe。**サーバ専用** —— secret key を "use client" 側に渡さないこと。

   鍵が無ければ null。決済ボタンは「準備中」の見た目に落ちて、Contact からの
   取り置き（今までの運用）がそのまま残る。鍵が無いだけでカートが 500 になる
   と、決済を試す前に売り物のページが死ぬ。
   ------------------------------------------------------------------ */

const secretKey = process.env.STRIPE_SECRET_KEY;

export const stripeEnabled = Boolean(secretKey);

let cached: Stripe | null = null;

export function stripe(): Stripe | null {
  if (!secretKey) return null;
  cached ??= new Stripe(secretKey, { typescript: true });
  return cached;
}

/**
 * 国際発送の送料（AUD）。0 にすると「送料込み」で送料の行が出なくなる。
 *
 * 静岡から豪州への EMS を一律で見た暫定値。実際の梱包と重量が決まったら
 * ここを直す —— 作品ごとに変える作りにはしていない（一箱一点で、重さの差が
 * 送料の段に届かないため）。
 */
export const SHIPPING_AUD = 35;

/** Checkout に出す国。発送できない国を選ばせないための一覧。 */
export const SHIPPING_COUNTRIES = ["AU", "NZ", "JP", "SG", "US", "CA", "GB"] as const;
