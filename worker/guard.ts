/* ------------------------------------------------------------------
   Worker の入口で、OpenNext に渡す前に断るもの（worker/index.ts が使う）。
   ------------------------------------------------------------------ */

/** 本文の上限。Server Action（Next の既定 1MB）・Webhook・管理画面の保存のどれもこれより小さい。 */
const MAX_BODY_BYTES = 1024 * 1024;

/**
 * OpenNext に渡す前に断るもの。
 *
 * - `/cdn-cgi/`: OpenNext の worker.js には開発用の `/cdn-cgi/image/` があり、本番にも入っている。
 *   任意の URL の画像を取りに行き、画像変換の枠を使う（監査 13）。Cloudflare が手前で
 *   止めるはずの道だが、ここでも閉じる。
 * - 大きすぎる本文: OpenNext は POST の本文を上限なしで丸ごと読み、もう一度読み直す（監査 19）。
 *   Content-Length が上限を超えていたら読む前に断る。
 */
export function refuse(request: Request): Response | null {
  const { pathname } = new URL(request.url);
  if (pathname.startsWith("/cdn-cgi/")) return new Response("Not found", { status: 404 });

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return new Response("Payload too large", { status: 413 });

  return null;
}
