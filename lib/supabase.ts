import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* ------------------------------------------------------------------
   Supabase — 管理画面が書き、公開ページが読む一つの DB。
   **サーバ専用**。service_role キーは RLS をバイパスするので、このモジュールを
   "use client" から import しないこと。NEXT_PUBLIC_ も付けない。

   環境変数が無いときは null を返す。呼び出し側は data/products.ts の値に落ちる
   —— microCMS と同じ考え方で、鍵の無い環境（ローカル・プレビュー）でも
   ビルドと表示が通る。「DB が未設定だからサイトが 500」は EC では一番やっては
   いけない壊れ方で、管理画面のために公開ページを人質に取ることになる。
   ------------------------------------------------------------------ */

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** 鍵が揃っているか。管理画面が「未接続」の案内を出すのに使う。 */
export const dbEnabled = Boolean(url && serviceKey);

let cached: SupabaseClient | null = null;
let warned = false;

export function db(): SupabaseClient | null {
  if (!url || !serviceKey) {
    if (!warned) {
      warned = true;
      console.info(
        "[studio] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が無いので、商品は data/products.ts の値で表示します",
      );
    }
    return null;
  }
  cached ??= createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** 公開ページのキャッシュタグ。管理画面で保存したらこれを revalidate する。 */
export const CATALOG_TAG = "catalog";
