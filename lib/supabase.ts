import "server-only";

import { PostgrestClient } from "@supabase/postgrest-js";

/* ------------------------------------------------------------------
   Supabase — 管理画面が書き、公開ページが読む一つの DB。
   **サーバ専用**。service_role キーは RLS をバイパスするので、このモジュールを
   "use client" から import しないこと。NEXT_PUBLIC_ も付けない。

   環境変数が無いときは null を返す。呼び出し側は data/products.ts の値に落ちる
   —— microCMS と同じ考え方で、鍵の無い環境（ローカル・プレビュー）でも
   ビルドと表示が通る。「DB が未設定だからサイトが 500」は EC では一番やっては
   いけない壊れ方で、管理画面のために公開ページを人質に取ることになる。

   **supabase-js ではなく postgrest-js を直に使う**（2026-10-08）。使っているのは
   表の読み書き（`.from()`）だけで、supabase-js はそれに認証・Storage・Realtime を
   抱き合わせて読み込みに 32ms かかる（postgrest-js だけなら 1ms）。SiteChrome が
   全ページでカタログを引くので、Cloudflare Workers では起動のたびの CPU 時間に乗る。
   ヘッダーは supabase-js が service_role キーで付けるものと同じ（apikey と Bearer）。
   認証や Storage が要るようになったら supabase-js に戻す。
   ------------------------------------------------------------------ */

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** 鍵が揃っているか。管理画面が「未接続」の案内を出すのに使う。 */
export const dbEnabled = Boolean(url && serviceKey);

let cached: PostgrestClient | null = null;
let warned = false;

export function db(): PostgrestClient | null {
  if (!url || !serviceKey) {
    if (!warned) {
      warned = true;
      console.info(
        "[studio] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が無いので、商品は data/products.ts の値で表示します",
      );
    }
    return null;
  }
  cached ??= new PostgrestClient(new URL("rest/v1", url.endsWith("/") ? url : `${url}/`).href, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  return cached;
}

/** 公開ページのキャッシュタグ。管理画面で保存したらこれを revalidate する。 */
export const CATALOG_TAG = "catalog";
