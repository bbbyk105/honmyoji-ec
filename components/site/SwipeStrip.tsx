"use client";

import { Children, useCallback, useRef, useState, type CSSProperties, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** 帯の中で一枚が占める割合(%)。残りの (100 - card) / 2 ずつが左右の覗きになる。 */
  card?: number;
  /** 帯をやめる断点。trackClassName の `sm:grid` / 親の `md:hidden` と必ず揃える。 */
  until?: "sm" | "md";
  /** コマ間。空きコマの幅から引くので、trackClassName に gap を手書きしない。 */
  gap?: 3 | 5;
  /** カウンタの左に出す名前。children と同じ順。省略すると罫だけになる。 */
  labels?: string[];
  /** 外側（余白だけ。版面の内側に留めるので、ここに負の margin を書かない） */
  className?: string;
  /** 帯そのもの。左右の裁ち落としと、断点から先で格子に戻すクラスを渡す。 */
  trackClassName?: string;
};

/* 断点も gap も静的な文字列で持つ — `${bp}:hidden` と書くと Tailwind が拾えない。 */
const HIDE = { sm: "sm:hidden", md: "md:hidden" } as const;
const AUTO = { sm: "sm:w-auto", md: "md:w-auto" } as const;
const GAP = { 3: { cls: "gap-3", px: 12 }, 5: { cls: "gap-5", px: 20 } } as const;

/**
 * スマホの横スワイプ帯。一画面一枚、左右に次の端が覗き、下に `01 / 03`。
 *
 * `snap-center` を書いただけでは中央に来ない。scrollLeft = 0 のとき一枚目を
 * 中央へ寄せる余地が無く、ブラウザは左端で止める — 作品が画面の左に寄って、
 * 次の一枚が画面の右端で文字ごと断ち切られる。両端に (100 - card) / 2 の
 * 空きコマを差して、一枚目と最後の一枚も中央に立てるようにしている。
 *
 * 空きコマの幅から gap を引くのは、コマと一枚目の間にも gap が入るため。
 * 幅は vw ではなく帯に対する % — vw はスクロールバーの分だけずれる。
 */
export function SwipeStrip({
  children,
  card = 78,
  until = "sm",
  gap = 5,
  labels,
  className = "",
  trackClassName = "",
}: Props) {
  const items = Children.toArray(children);
  const track = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const [index, setIndex] = useState(0);

  /** 帯の中央にいちばん近い一枚を数える。空きコマがあるので幅の等分では出せない。 */
  const onScroll = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = track.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      const mid = box.left + box.width / 2;
      let near = 0;
      let best = Infinity;
      el.querySelectorAll<HTMLElement>("[data-strip-card]").forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - mid);
        if (d < best) {
          best = d;
          near = i;
        }
      });
      setIndex(near);
    });
  }, []);

  const side = `calc(${(100 - card) / 2}% - ${GAP[gap].px}px)`;

  return (
    <div className={className}>
      <div
        ref={track}
        onScroll={onScroll}
        className={`flex snap-x snap-mandatory ${GAP[gap].cls} overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${trackClassName}`}
      >
        <span aria-hidden style={{ width: side }} className={`shrink-0 ${HIDE[until]}`} />
        {items.map((child, i) => (
          <div
            key={i}
            data-strip-card
            style={{ "--card": `${card}%` } as CSSProperties}
            className={`w-[var(--card)] shrink-0 snap-center self-start ${AUTO[until]}`}
          >
            {child}
          </div>
        ))}
        <span aria-hidden style={{ width: side }} className={`shrink-0 ${HIDE[until]}`} />
      </div>

      {/*
        いま何枚目か。点の列にはしない — 罫が一本あって、居るところだけ ink になる。
        カウンタは PDP のギャラリーと同じ字面（DESIGN.md の 01 / 05）。
      */}
      {items.length > 1 ? (
        <div className={`mt-5 flex items-center gap-4 ${HIDE[until]}`}>
          {labels ? (
            <p className="min-w-0 shrink truncate font-sans text-[9.5px] uppercase tracking-[0.22em] text-mist">
              {labels[index]}
            </p>
          ) : null}
          <div aria-hidden className="flex flex-1 gap-1.5">
            {items.map((_, i) => (
              <span
                key={i}
                className={`h-px flex-1 transition-colors duration-500 ${i === index ? "bg-ink" : "bg-line"}`}
              />
            ))}
          </div>
          <p className="shrink-0 font-sans text-[9.5px] tabular-nums tracking-[0.22em] text-mist">
            {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
