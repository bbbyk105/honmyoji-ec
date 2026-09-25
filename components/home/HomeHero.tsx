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
 * 刻んでいた。いまの一枚は本堂の祭壇の前に三本が立つ写真で、金具・ろうそく・花で画面の
 * 隅々まで細かく、どこに文字を載せても読めない —— 暗幕を敷けば読めるが、それは DESIGN.md が
 * 捨てたグラデーションに戻ることになる。なので写真には何も載せず、文字は写真の外の黒に置く
 * （展示の図版と、その脇のキャプション板の関係）。
 * 最初は窓辺の着姿（window-wide）を置いたが、人が主役になって作品が小さく、
 * 「どこにでもある着物の写真」に見えた（2026-09-25 本人判断で差し替え）。
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
          切ると 2.7:1 になり、持ち手の先か台の錦が切れる。高さを取れば三本が丸ごと収まる。
          三本は原稿の左寄り（横 18–58%）に立っているので、どの幅でも左へ寄せて切る。
          タブレット縦（md）は写真に残りの高さを全部渡す —— 3:2 のままだと下に 400px の黒が残った。
        */}
        <figure
          data-image-role="hero-campaign"
          data-image-ratio="3/2"
          data-hero-frame
          className="relative m-0 aspect-[4/5] w-full overflow-hidden sm:aspect-[3/2] md:aspect-auto md:min-h-[360px] md:flex-1 lg:order-2 lg:col-span-8 lg:col-start-5 lg:h-full lg:min-h-0"
        >
          <ImageWell reveal="band" className="absolute inset-0">
            <Image
              src="/images/scenes/altar-standing.webp"
              alt="Three tatami-beri bottle bags standing on brocade before the altar of the main hall"
              fill
              priority
              fetchPriority="high"
              sizes="(min-width: 1024px) 64vw, 100vw"
              className="object-cover object-[40%_50%] sm:object-center md:object-[30%_50%] lg:object-[10%_50%]"
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
