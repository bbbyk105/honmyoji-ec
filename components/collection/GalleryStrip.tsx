"use client";

import Image from "next/image";
import { SwipeStrip } from "@/components/site/SwipeStrip";

import { useLightbox, type Shot } from "./Lightbox";

/**
 * スマホのギャラリー。写真が5枚あると縦積みでは 2400px 送ることになるので、
 * 横スワイプにして一画面一枚にする。次の一枚の端を覗かせて「まだある」を出す。
 * 台の比率は 4:5 に揃える — 横に並べるものの高さが揃っていないと帯が崩れて見える。
 *
 * 中央寄せと 01 / 05 は SwipeStrip が持つ。呼び出し側が `md:hidden` の中なので
 * 断点も md で揃える（sm で畳むと 640–767px だけ中央から外れる）。
 */
/** `offset` は拡大表示の通し番号のずれ。ヒーローが 0 番なので、帯の 1 枚目は 1 番。 */
export function GalleryStrip({ shots, offset = 0 }: { shots: Shot[]; offset?: number }) {
  const { open } = useLightbox();

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
    <SwipeStrip
      card={82}
      until="md"
      gap={3}
      labels={shots.map((s) => s.caption)}
      trackClassName="-mx-5"
    >
      {shots.map((shot, i) => (
        // スワイプの邪魔をしないよう、拡大は「触れた指が動かなかったとき」に開く
        // （button の click はドラッグ後には発火しないので、これで足りる）
        <button
          key={shot.src}
          type="button"
          onClick={() => open(i + offset)}
          aria-label={`${shot.caption} を拡大する`}
          className="relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden bg-parchment"
        >
          <Image src={shot.src} alt={shot.alt} fill sizes="82vw" className="object-cover" />
        </button>
      ))}
    </SwipeStrip>
  );
}
