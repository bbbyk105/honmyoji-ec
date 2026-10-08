/* ------------------------------------------------------------------
   Supabase を眠らせない。

   無料プランの Supabase は、7 日アクセスが無いとプロジェクトを止める。止まると
   ホスト名が DNS から消え、Worker からの読み書きは Cloudflare の 1016 になる
   （2026-10-08 に踏んだ。9/29 の保存から 9 日空いて止まり、管理画面のステータスが
   保存できなかった）。公開ページは作り置きを返すので、訪問があっても DB に届くとは
   限らない。売り出したあとに止まると、決済が通っても注文が記録されない。

   Worker の定期実行（`wrangler.jsonc` の triggers）から一日一回、一行だけ読む。
   ------------------------------------------------------------------ */

export type KeepAliveEnv = {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

/**
 * piece_overrides を一行だけ読む。鍵が無ければ何もせず null。
 * 読めなければ投げる（定期実行の失敗として Workers Logs に残す）。
 */
export async function pingDatabase(env: KeepAliveEnv, fetchImpl: typeof fetch = fetch): Promise<number | null> {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  const endpoint = new URL("rest/v1/piece_overrides?select=slug&limit=1", url.endsWith("/") ? url : `${url}/`);
  const res = await fetchImpl(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(10_000),
  });
  // 本文は使わないが、読み切って接続を返す
  const body = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${body.slice(0, 120)}`);
  return res.status;
}
