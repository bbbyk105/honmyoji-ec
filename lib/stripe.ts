import "server-only";

import Stripe from "stripe";

/* ------------------------------------------------------------------
   Stripe の SDK。**サーバ専用** —— secret key を "use client" 側に渡さないこと。

   **読み込むだけで重い**（80ms ほど）ので、決済を作る・確かめる場所でだけ import する。
   「決済が使えるか」や送料を知りたいだけなら `lib/stripe-config.ts`。
   eslint（`no-restricted-imports`）が、決められた場所以外での import を止める。

   鍵が無ければ null。決済ボタンは「準備中」の見た目に落ちて、Contact からの
   取り置き（今までの運用）がそのまま残る。鍵が無いだけでカートが 500 になる
   と、決済を試す前に売り物のページが死ぬ。

   Cloudflare Workers で動かすので、Node の http と crypto に頼らない:
   通信は fetch（`createFetchHttpClient`）、Webhook の署名は Web Crypto
   （`webCrypto` を `constructEventAsync` に渡す）。同期の `constructEvent` は
   Workers では投げる。
   ------------------------------------------------------------------ */

let cached: Stripe | null = null;

export function stripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  cached ??= new Stripe(secretKey, {
    typescript: true,
    httpClient: Stripe.createFetchHttpClient(),
  });
  return cached;
}

/** Webhook の署名検証に渡す暗号の実装（Web Crypto）。 */
export const webCrypto = Stripe.createSubtleCryptoProvider();
