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
/**
 * お客さまが http で来たか。Cloudflare の手前が付ける `cf-visitor`（{"scheme":"http"}）で見る ——
 * request.url の http: は使わない。手元の wrangler dev は URL のホスト名を本番のドメインに書き換えて
 * http で渡すので、それで判定すると https への転送が手元でぐるぐる回る（2026-10-09 に踏んだ）。
 * 手元には cf-visitor が無いので転送しない。
 */
function cameOverHttp(request: Request): boolean {
  try {
    return JSON.parse(request.headers.get("cf-visitor") ?? "{}").scheme === "http";
  } catch {
    return false;
  }
}

export function intercept(request: Request): Response | null {
  const url = new URL(request.url);
  const www = url.hostname === `www.${CANONICAL_HOST}`;
  if (www || (url.hostname === CANONICAL_HOST && cameOverHttp(request))) {
    url.protocol = "https:";
    url.hostname = CANONICAL_HOST;
    url.port = "";
    const safe = request.method === "GET" || request.method === "HEAD";
    return Response.redirect(url.toString(), safe ? 301 : 308);
  }

  if (url.pathname.startsWith("/cdn-cgi/")) return new Response("Not found", { status: 404 });

  const raw = request.headers.get("content-length");
  if (raw !== null) {
    const length = Number(raw);
    if (!Number.isInteger(length) || length < 0) return new Response("Bad request", { status: 400 });
    if (length > MAX_BODY_BYTES) return new Response("Payload too large", { status: 413 });
  }

  return null;
}

/**
 * Content-Length の無い本文（chunked など）は、読みながら数えて上限で止める。intercept では
 * 長さが分からないので断れない —— 素通しすると OpenNext が上限なしで二度読む（監査 19）。
 * ふつうのブラウザ・Stripe・microCMS は Content-Length を付けて送るので、ここは通らない。
 */
export function limitBody(request: Request, max = MAX_BODY_BYTES): Request {
  if (request.body === null || request.headers.has("content-length")) return request;
  let seen = 0;
  const limited = request.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        seen += chunk.byteLength;
        if (seen > max) controller.error(new Error("Payload too large"));
        else controller.enqueue(chunk);
      },
    }),
  );
  return new Request(request, { body: limited, duplex: "half" } as RequestInit);
}
