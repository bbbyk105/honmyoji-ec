import { FilterXSS, type IWhiteList } from "xss";

/* ------------------------------------------------------------------
   microCMS のリッチエディタの HTML を、描く前に無害化する。**サーバ専用で使う**。

   本文は dangerouslySetInnerHTML でそのまま描くので、入稿された HTML に script や
   onerror が混ざると、管理画面（/studio）と同じオリジンで動く —— ログイン中の人の
   権限で管理画面を操作できてしまう（監査 6）。リッチエディタが出すタグだけを残し、
   属性も絞る。色や文字サイズ（style・class）は落とす（AGENTS.md: CMS 側で付けない）。
   ------------------------------------------------------------------ */

const HEADING = ["id"];
const CELL = ["colspan", "rowspan"];

const ALLOWED: IWhiteList = {
  h2: HEADING,
  h3: HEADING,
  h4: HEADING,
  h5: HEADING,
  p: [],
  br: [],
  hr: [],
  strong: [],
  b: [],
  em: [],
  i: [],
  u: [],
  s: [],
  del: [],
  sub: [],
  sup: [],
  a: ["href", "target", "rel"],
  ul: [],
  ol: [],
  li: [],
  blockquote: [],
  figure: [],
  figcaption: [],
  img: ["src", "alt", "width", "height"],
  table: [],
  thead: [],
  tbody: [],
  tr: [],
  th: CELL,
  td: CELL,
  code: [],
  pre: [],
  span: [],
};

const filter = new FilterXSS({
  whiteList: ALLOWED,
  // 許していないタグは外して中身の文字だけ残す。script などは中身ごと捨てる
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style", "iframe", "object", "embed", "noscript", "template"],
  allowCommentTag: false,
});

/** 無害化した HTML。javascript: の href / src も xss が落とす。 */
export function sanitizeBlogHtml(html: string): string {
  return filter.process(html);
}
