import type { CSSProperties } from "react";

/**
 * 完売の帯。罫を一本引いて、その真ん中で言う。
 *
 * カードや斜めのリボンは持ち込まない（DESIGN.md）。地は動かさず、像のほうを
 * 淡くして帯を ivory で引く — 一覧を流し見しても、どれが残っているかが写真の側で分かる。
 * 位置は呼び出し側が決める: 展示台では**像の縦中央**（台の中央に固定すると、背の低い
 * 作品では帯が像の上に浮いて、掛かっているように見えない）。ラベルは下の StatusPill が
 * 読み上げるので、ここは装飾として `aria-hidden`。
 */
export function SoldBand({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <span
      aria-hidden
      style={style}
      className={`pointer-events-none absolute flex items-center gap-3 ${className}`}
    >
      {/*
        面の一番強い色で引く。像は 45% に落としてあるので、墨の面では像が暗く沈んで生成りの罫が、
        紙の面では像が白く褪せて墨の罫が立つ —— どちらも「地の色に像が退いた上に、面の字で書く」。
      */}
      <span className="h-px flex-1 bg-ivory/60" />
      <span className="caps text-[11px] text-ivory">Sold out</span>
      <span className="h-px flex-1 bg-ivory/60" />
    </span>
  );
}
