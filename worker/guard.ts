/* ------------------------------------------------------------------
   Worker の入口で、OpenNext に渡す前に返すもの（転送と拒否）。worker/index.ts が使う。
   ------------------------------------------------------------------ */

/** 本番の住所。www と http はここへ送る。 */
const CANONICAL_HOST = "honmyoujifuji.com";

/** 本文の上限。Server Action（Next の既定 1MB）・Webhook・管理画面の保存のどれもこれより小さい。 */
const MAX_BODY_BYTES = 1024 * 1024;

/**
 * OpenNext に渡す前に返すもの。
 *
 * - `www.` と `http://`: 本体の `https://honmyoujifuji.com` へ恒久の転送。同じページが四つの
 *   住所で見えると、検索エンジンが別のページとして数え、ブラウザのカートも住所ごとに分かれる。
 *   POST などは 308（本文ごと送り直してもらう）、それ以外は 301。
 * - `/cdn-cgi/`: OpenNext の worker.js には開発用の `/cdn-cgi/image/` があり、本番にも入っている。
 *   任意の URL の画像を取りに行き、画像変換の枠を使う（監査 13）。Cloudflare が手前で
 *   止めるはずの道だが、ここでも閉じる。
 * - 大きすぎる本文: OpenNext は POST の本文を上限なしで丸ごと読み、もう一度読み直す（監査 19）。
 *   Content-Length が上限を超えていたら読む前に断る。
 */
export function intercept(request: Request): Response | null {
  const url = new URL(request.url);
  const www = url.hostname === `www.${CANONICAL_HOST}`;
  if (www || (url.hostname === CANONICAL_HOST && url.protocol === "http:")) {
    url.protocol = "https:";
    url.hostname = CANONICAL_HOST;
    url.port = "";
    const safe = request.method === "GET" || request.method === "HEAD";
    return Response.redirect(url.toString(), safe ? 301 : 308);
  }

  if (url.pathname.startsWith("/cdn-cgi/")) return new Response("Not found", { status: 404 });

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return new Response("Payload too large", { status: 413 });

  return null;
}
