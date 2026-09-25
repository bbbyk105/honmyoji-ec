import Image from "next/image";
import { Button } from "@/components/site/Button";
import { ImageWell } from "@/components/site/ImageWell";
import { SHELL } from "@/components/site/Shell";
import { HomeHeroMotion } from "./HomeHeroMotion";

type Props = {
  /** 作品の数。一覧の件数と揃える（焼き込むとカタログを直したときにずれる）。 */
  count: number;
};

/**
 * 第一画面。**写真は写真、文字は文字**（2026-09-25）。
 *
 * 以前は暗い一枚（hero-weave）の左の余白に縦組み・クレジット・見出し・導線・所在地を
 * 刻んでいた。カメラマンの写真は窓の光で明るく、文字を載せると読めない —— 暗幕を敷けば
 * 読めるが、それは DESIGN.md が捨てたグラデーションに戻ることになる。なので写真には何も
 * 載せず、文字は写真の外の黒に置く（展示の図版と、その脇のキャプション板の関係）。
 * 縦組みの一行・小さな大文字のクレジット・`01 — Honmyoji` の足元は外した。どれも
 * 何も言っていないのに、一画面に「飾り」が三つ並んでいた。
 *
 * この節は `sticky top-0`。下の面（`[data-page-sheet]`）が z 上位で敷かれていて、
 * スクロールするとそれが下から上がってきてこの部屋を覆う。
 *
 * Server Component。ここは描くだけで、入場と退場の動きは `HomeHeroMotion`（client）が
 * `data-hero-*` を探して付ける。写真・見出し・導線のマークアップは client に載らない。
 */
export function HomeHero({ count }: Props) {
  return (
    <HomeHeroMotion>
      <div
        className={`${SHELL} flex flex-1 flex-col pb-6 pt-4 lg:grid lg:min-h-0 lg:grid-cols-12 lg:gap-8 lg:pb-8 lg:pt-6`}
      >
        {/*
          lg 以上は右 8 段に写真を画面の高さいっぱい、左 4 段の足元に文字。版面の幅で横長に
          切ると 2.7:1 になり、人の頭と手元の作品が同時に入らなかった（窓辺の一枚は、頭が上 12%、
          作品が下 85% にある）。高さを取れば両方が収まる。
          スマホは 4:5 に立てて、人と作品が収まる右寄りで切る。
        */}
        <figure
          data-image-role="hero-campaign"
          data-image-ratio="3/2"
          data-hero-frame
          className="relative m-0 aspect-[4/5] w-full overflow-hidden sm:aspect-[3/2] lg:order-2 lg:col-span-8 lg:col-start-5 lg:aspect-auto lg:h-full"
        >
          <ImageWell reveal="band" className="absolute inset-0">
            <Image
              src="/images/scenes/window-wide.webp"
              alt="A woman in a cream kimono at the temple window, holding the Hishi handbag"
              fill
              priority
              fetchPriority="high"
              sizes="(min-width: 1024px) 64vw, 100vw"
              className="object-cover object-[66%_50%] sm:object-[50%_40%] lg:object-[60%_50%]"
            />
          </ImageWell>
        </figure>

        <div
          data-hero-fade
          className="grid gap-6 pt-7 md:grid-cols-12 md:items-end md:gap-8 lg:order-1 lg:col-span-4 lg:flex lg:flex-col lg:items-start lg:justify-end lg:gap-8 lg:pt-0"
        >
          <h1
            data-hero-title
            className="font-display text-[clamp(34px,3.4vw,52px)] font-light leading-[1.04] tracking-[-0.015em] text-ivory md:col-span-7"
          >
            Tatami-beri, woven by hand at a temple in Fuji.
          </h1>
          <div data-hero-aside className="md:col-span-5 md:col-start-8 md:pb-1.5 lg:pb-0">
            <p className="max-w-[40ch] font-sans text-[14.5px] leading-[1.8] text-bone">
              {count} pieces, each made once from the edging of tatami rooms and paper band recycled in
              Fuji City. Photographed at Honmyoji, released one by one.
            </p>
            <Button href="/collection" variant="link-light" className="mt-5">
              View the collection
            </Button>
          </div>
        </div>
      </div>

      {/* 紙に覆われる間、部屋を落とす層。載せるのは GSAP だけ（初期値は透明）。 */}
      <div aria-hidden data-hero-dim className="pointer-events-none absolute inset-0 z-20 bg-sumi opacity-0" />
    </HomeHeroMotion>
  );
}
