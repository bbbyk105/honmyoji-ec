import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import "@/components/motion/register";

/*
  行マスクの下に足す、下がりの分の余白。見出しの Poppins は下がりが深く、g の底が
  行の箱から 0.09em（行間 1.05）〜 0.11em（1.02）出る（実測）。行の箱ちょうどで clip すると
  g・p・y の足が切れたまま残る（2026-09-25 に書体を入れ替えて踏んだ）。
  余白は負の margin で打ち消して組みは動かさず、行はその分だけ深い位置から起こす ——
  yPercent 100 のままだと、待っている行の頭が余白から覗く。
*/
const DESCENDER_ROOM = "0.15em";

/** 行がマスクの下から起きるときの起点。`tl.from(split.lines, { ...LINES_FROM, … })` */
export const LINES_FROM = { yPercent: 100, y: DESCENDER_ROOM } as const;

/**
 * 見出しを行ごとのマスクに分ける。**SplitText.create を直に呼ばないこと** ——
 * マスクが行の箱ちょうどになり、下がりが切れる。戻すときは返り値の `revert()`。
 */
export function splitLines(el: HTMLElement): SplitText {
  const split = SplitText.create(el, { type: "lines", mask: "lines" });
  gsap.set(split.masks, { paddingBottom: DESCENDER_ROOM, marginBottom: `-${DESCENDER_ROOM}` });
  return split;
}
