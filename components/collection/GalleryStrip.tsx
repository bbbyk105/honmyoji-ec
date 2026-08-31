import Image from "next/image";
import { SwipeStrip } from "@/components/site/SwipeStrip";

export type Shot = { src: string; alt: string; caption: string };

/**
 * スマホのギャラリー。写真が5枚あると縦積みでは 2400px 送ることになるので、
 * 横スワイプにして一画面一枚にする。次の一枚の端を覗かせて「まだある」を出す。
 * 台の比率は 4:5 に揃える — 横に並べるものの高さが揃っていないと帯が崩れて見える。
 *
 * 中央寄せと 01 / 05 は SwipeStrip が持つ。呼び出し側が `md:hidden` の中なので
 * 断点も md で揃える（sm で畳むと 640–767px だけ中央から外れる）。
 */
export function GalleryStrip({ shots }: { shots: Shot[] }) {
  // 一枚しかない作品（hisui / ichimatsu / tsugi）でカルーセルにすると、
  // 送れない帯と 01 / 01 のカウンタだけが残って壊れて見える。
  if (shots.length < 2) {
    const only = shots[0];
    if (!only) return null;
    return (
      <figure>
        <div className="relative aspect-[4/5] overflow-hidden bg-parchment">
          <Image src={only.src} alt={only.alt} fill sizes="100vw" className="object-cover" />
        </div>
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
      {shots.map((shot) => (
        <div key={shot.src} className="relative aspect-[4/5] overflow-hidden bg-parchment">
          <Image src={shot.src} alt={shot.alt} fill sizes="82vw" className="object-cover" />
        </div>
      ))}
    </SwipeStrip>
  );
}
