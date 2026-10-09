import "server-only";

/* ------------------------------------------------------------------
   決済の設定。**Stripe の SDK を読まない**。

   SDK は読み込むだけで 80ms ほどかかる（2026-10-08 に手元で計測）。外枠（SiteChrome）が
   「決済が使えるか」を知るために `lib/stripe.ts` を読んでいた頃は、全ページの描画が
   その 80ms を払っていた。Cloudflare Workers では起動のたびの CPU 時間にそのまま乗る。

   SDK が要るのは、決済を作る（checkout/actions）・確かめる（Webhook）・名前を出す
   （thank-you）の三か所だけ。それ以外はここを読む。
   ------------------------------------------------------------------ */

/**
 * 鍵があるか。無ければ決済ボタンは「準備中」に落ち、Contact からの取り置きが残る。
 *
 * 外枠（SiteChrome）がこれで決済ボタンを出すので、作り置きのページにはビルドの時点の値が
 * 残る。ビルドには鍵を渡さないので、`scripts/cf-deploy.mjs` が Worker の secrets に
 * STRIPE_SECRET_KEY があるか（名前だけ）を見て、ビルドにだけ `STRIPE_CHECKOUT_AT_BUILD=1`
 * を渡す。無いと、デプロイのたびに次の再検証（10 分）まで決済ボタンが消える。
 */
export const stripeEnabled = Boolean(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_CHECKOUT_AT_BUILD);

// 送料と発送先は data/shipping.ts（ここには置かない。特商法の表記からも読めるように）
