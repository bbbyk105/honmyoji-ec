import { LINE_LABEL, type Product, type ProductLine } from "@/data/products";

/* ------------------------------------------------------------------
   作品を検索エンジンと読み上げに向けて言う言葉（title・説明文・写真の alt・構造化データの名前）。
   ページの見出しや一言（`note`）は詩のままにして、作品が**何であるか**（区分と素材）はここで足す。

   英語の売り場では、畳の縁は "tatami edge"（と "tatami heri"）と書かれることが多く、
   "tatami-beri" は少ない（2026-10-15 に調べた）。サイトの語は tatami-beri のまま、
   検索のための言葉には "tatami edge" を併記する。

   サーバー専用にしない —— 一覧の写真（PieceTile）や商品ページの写真の alt も使う。
   ------------------------------------------------------------------ */

type Piece = Pick<Product, "name" | "kanji" | "line" | "note">;

/** 区分ごとの素材の言い方（説明文に入れる）。data/products.ts の LINE_BLURB と食い違わないこと。 */
const LINE_MATERIAL: Record<ProductLine, string> = {
  "tatami-beri": "Woven from tatami-beri (tatami edge) remnants and recycled paper band",
  origami: "Folded from wide bands of tatami-beri (tatami edge)",
  handbag: "Made from tatami-beri (tatami edge)",
  kimono: "Pieced from vintage kimono cloth",
  apron: "With a panel of vintage kimono cloth",
};

/** 作品が何であるか（"Tatami-beri bottle bag"）。 */
export function pieceKind(p: Pick<Product, "line">): string {
  return LINE_LABEL[p.line].en;
}

/** 構造化データの商品名。名前だけ（"Ai 藍"）だと、検索や Google ショッピングで何の品か分からない。 */
export function pieceProductName(p: Piece): string {
  return `${p.name} ${p.kanji} — ${pieceKind(p)}`;
}

/** 作品のページの title（後ろに " — MIROKU" が付く）。値段は出ていれば添える。 */
export function pieceTitle(p: Piece, price: string | null): string {
  return `${p.name} ${p.kanji} — ${pieceKind(p)}${price ? `, ${price}` : ""}`;
}

/**
 * 作品のページの説明文。検索結果では 150 字ほどで切れるので、何であるかを先に言う。
 * 作品番号（SKU）は入れない（探す人は打たない）。
 */
export function pieceDescription(p: Piece): string {
  return `${pieceKind(p)}, one of a kind. ${p.note} ${LINE_MATERIAL[p.line]}, handmade at Honmyoji Temple in Fuji City, Japan.`;
}

/** 作品の主役の写真の alt（一覧・トップ・商品ページのヒーロー）。 */
export function pieceAlt(p: Piece): string {
  return `${p.name} — ${pieceKind(p)}. ${p.note}`;
}

/** 商品ページのギャラリーの写真の alt。 */
export function pieceGalleryAlt(p: Piece, index: number, count: number): string {
  return `${p.name} — ${pieceKind(p)}, photograph ${index} of ${count}`;
}
