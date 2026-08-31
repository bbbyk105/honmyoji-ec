"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { useLightbox, type Shot } from "./Lightbox";

/**
 * スマホのギャラリー。写真が5枚あると縦積みでは 2400px 送ることになるので、
 * 横スワイプにして一画面一枚にする。次の一枚の端を覗かせて「まだある」を出す。
 * 台の比率は 4:5 に揃える — 横に並べるものの高さが揃っていないと帯が崩れて見える。
 */
/** `offset` は拡大表示の通し番号のずれ。ヒーローが 0 番なので、帯の 1 枚目は 1 番。 */
export function GalleryStrip({ shots, offset = 0 }: { shots: Shot[]; offset?: number }) {
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const { open } = useLightbox();

  const onScroll = () => {
    const el = track.current;
    if (!el || shots.length === 0) return;
    const step = el.scrollWidth / shots.length;
    const next = Math.round(el.scrollLeft / step);
    setIndex(Math.min(shots.length - 1, Math.max(0, next)));
  };

  // 一枚しかない作品（hisui / ichimatsu / tsugi）でカルーセルにすると、
  // 送れない帯と 01 / 01 のカウンタだけが残って壊れて見える。
  if (shots.length < 2) {
    const only = shots[0];
    if (!only) return null;
    return (
      <figure>
        <button
          type="button"
          onClick={() => open(offset)}
          aria-label="写真を拡大する"
          className="relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden bg-parchment"
        >
          <Image src={only.src} alt={only.alt} fill sizes="100vw" className="object-cover" />
        </button>
        <figcaption className="mt-3 font-sans text-[9.5px] uppercase tracking-[0.22em] text-mist">
          {only.caption}
        </figcaption>
      </figure>
    );
  }

  return (
    <div>
      <div
        ref={track}
        onScroll={onScroll}
        className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {shots.map((shot, i) => (
          <div key={shot.src} className="w-[82vw] max-w-110 shrink-0 snap-center">
            {/* スワイプの邪魔をしないよう、拡大は「触れた指が動かなかったとき」に開く
                （button の click はドラッグ後には発火しないので、これで足りる） */}
            <button
              type="button"
              onClick={() => open(i + offset)}
              aria-label={`${shot.caption} を拡大する`}
              className="relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden bg-parchment"
            >
              <Image src={shot.src} alt={shot.alt} fill sizes="82vw" className="object-cover" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-4">
        <p className="min-w-0 truncate font-sans text-[9.5px] uppercase tracking-[0.22em] text-mist">
          {shots[index]?.caption}
        </p>
        <p className="shrink-0 font-sans text-[9.5px] tabular-nums tracking-[0.22em] text-mist">
          {String(index + 1).padStart(2, "0")} / {String(shots.length).padStart(2, "0")}
        </p>
      </div>
    </div>
  );
}
