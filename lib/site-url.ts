import { site } from "@/data/site";

/* ------------------------------------------------------------------
   サイトの基準 URL。canonical（layout の metadataBase）・サイトマップ・構造化データ・
   メールのリンクが同じ決め方をするよう、ここ一つにまとめる。
   `NEXT_PUBLIC_SITE_URL` が無いか空なら本番のドメイン（`site.url`）。
   ------------------------------------------------------------------ */

/** 末尾の / なし。 */
export const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL || site.url).replace(/\/$/, "");

/** サイト内のパス → 絶対 URL。 */
export function siteUrl(path: string): string {
  return `${SITE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}
