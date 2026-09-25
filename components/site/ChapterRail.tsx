"use client";

import { scrollToChapter } from "@/components/motion/lenis";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { useSurfaceAt } from "@/hooks/useSurfaceAt";
import { twoDigits } from "@/lib/format";

export type Chapter = {
  /** 節に振った id。`app/(site)/page.tsx` 側と一致させる。 */
  id: string;
  label: string;
};

/**
 * 章のレール。今どの節にいるかを、番号だけで左の余白に立てる。
 *
 * 長い一枚のページは、節が続いているだけだと読者に現在地が無い。図録に頁の柱があるように、
 * 番号を一列立てておくと「まだ半ばだ」が分かる。語は普段は出さない —— レールに触れたときだけ、
 * 番号の右に節の名が出る。常に出していると、本文の左に二本目の目次が立つことになる。
 *
 * **ヒーローの上には出さない。** 第一画面には縦組みの一行が同じ帯に立っていて、
 * ヒーロー自身の足元にも `01 — Honmyoji` の罫がある。そこへレールを重ねると、
 * 一画面に 01 が二つ並び、縦の要素が三本になる（実際に重なった）。表紙に柱は要らない。
 * 二節目に入ってから立ち上がり、表紙へ戻ると引く。
 *
 * **版面の余白の中に置く。** lg 以上の左余白は 48px（`SHELL` の `lg:px-12`）しかないので、
 * 現在地は「番号の横に伸びる線」ではなく**番号の下に引く罫**で言う —— 横に伸ばすと
 * 本文の左端に数 px まで迫る。縦に積めばレールの幅は数字の幅で済む。
 * それより狭い画面では余白そのものが無いので、出さない。
 *
 * 番号の一つ目はヒーロー。sticky で貼り付いている節は ScrollTrigger が測れないので、
 * 監視するのは二つ目以降だけで、一つ目は「二つ目より上にいる」で決める（`useScrollSpy` に null を渡す）。
 */
export function ChapterRail({ chapters }: { chapters: Chapter[] }) {
  const active = useScrollSpy(
    chapters.map((chapter, i) => (i === 0 ? null : chapter.id)),
    "top 45%",
  );

  /* 表紙（ヒーロー）にいるあいだは引いておく。 */
  const onCover = active === 0;
  /* 柱は画面の縦の中ほどに立つので、そこを流れている面に字の色を合わせる。 */
  const onPaper = useSurfaceAt((vh) => vh / 2);

  return (
    <nav
      aria-label="Chapters"
      className={`pointer-events-none fixed left-3 top-1/2 z-40 hidden -translate-y-1/2 transition-opacity duration-700 ease-[var(--ease-soft)] lg:block ${
        onCover ? "opacity-0" : "opacity-100"
      } ${onPaper === true ? "tone-paper" : ""}`}
      aria-hidden={onCover}
    >
      <ol className="group/rail flex flex-col gap-3.5">
        {chapters.map((chapter, i) => {
          const current = i === active;
          return (
            <li key={chapter.id} className="relative">
              <button
                type="button"
                tabIndex={onCover ? -1 : undefined}
                onClick={() => scrollToChapter(i === 0 ? null : chapter.id)}
                aria-current={current ? "true" : undefined}
                className="pointer-events-auto block outline-none"
              >
                <span
                  className={`block font-sans text-[11px] tabular-nums leading-none transition-colors duration-700 ease-[var(--ease-soft)] ${
                    current ? "text-ivory" : "text-mist/70"
                  }`}
                >
                  {twoDigits(i + 1)}
                </span>
                {/* 現在地は色ではなく罫で言う。番号だけ明るくしても、並ぶと差が読めない。 */}
                <span
                  aria-hidden
                  className={`mt-[5px] block h-px origin-left bg-ivory/55 transition-transform duration-700 ease-[var(--ease-soft)] ${
                    current ? "scale-x-100" : "scale-x-0"
                  }`}
                />
                {/*
                  節の名。レールに触れたときだけ。絶対配置にしてあるのは、
                  透明でも場所を取ると本文の上に当たり判定が残るため。
                */}
                <span
                  className={`pointer-events-none absolute left-full top-0 ml-3 whitespace-nowrap font-sans text-[11px] leading-none opacity-0 transition-opacity duration-500 group-hover/rail:opacity-100 ${
                    current ? "text-ivory" : "text-mist"
                  }`}
                >
                  {chapter.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
