import Image from "next/image";
import { Button } from "@/components/site/Button";
import { SHELL } from "@/components/site/Shell";
import { site } from "@/data/site";
import { HomeHeroMotion } from "./HomeHeroMotion";

type Props = {
  /** 素材の記事への導線。記事は microCMS 側で入れ替わるので slug を焼き込まない。 */
  materialHref?: string;
};

/** 展示のクレジット。三つ以上並べると帯になるので増やさない。 */
const CREDITS = ["Handwoven", "Tatami-beri / paper band", "One of a kind"];

/**
 * 第一画面。DESIGN.md の「ヒーローは刻まれた写真であって、左コピー / 右写真ではない」は
 * ここでも守っている — 版を割らず、一枚の写真そのものが持つ左の余白に文字を刻む。
 * **写真には何も掛けない**（暗幕も継ぎ目も外した理由は globals.css の Home hero の節）。
 * 地はサイト全体と同じ一色の黒。以前はこの節だけ一段明るくして（#1b1710）「写真が部屋を
 * 照らしている」差を作っていたが、地を一色に畳んだので段は無い（2026-09-20）。覆われる合図は
 * **上がってくる面の上辺に引いた罫一本**が持つ —— 黒が黒を覆うのは、線が無いと見えない。
 *
 * 縦組みの一行が主役。英語の見出しは支え。写真は原寸で右に置き、左の余白は空けておく。
 * 版面は SHELL — 写真だけが画面いっぱいに出るので、文字の左端は下のセクションと揃う。
 *
 * この節は `sticky top-0`。下の面（`[data-page-sheet]`）が z 上位で敷かれていて、
 * スクロールするとそれが下から上がってきてこの部屋を覆う。覆われる間に文字を先に消し、
 * 部屋を奥へ沈めているので、境目は「節が変わった」ではなく「照明が落ちた」に見える。
 *
 * Server Component。ここは描くだけで、入場と退場の動きは `HomeHeroMotion`（client）が
 * `data-hero-*` を探して付ける。写真・見出し・導線のマークアップは client に載らない。
 */
export function HomeHero({ materialHref = "/blog" }: Props) {
  return (
    <HomeHeroMotion>
      {/*
        写真は画面いっぱい。左に余白のある一枚なので、切らずにそのまま置ける。
        スマホは縦横比が違いすぎて左の余白が消えるため、下半分の帯として敷く。

        帯を 50svh 取ると、原寸 16:9 が縦いっぱいで収まり、作品が丸ごと立つ
        （40% では作品が帯の高さで切れ、その上に足元の暗幕が重なって見えなくなっていた）。
        寄せは右端 — 作品の右の余白は原稿に 5% しかないので、右へ振り切ったときだけ
        左右の余白が釣り合う。上端は断ち切り —— 以前はグラデーションでにじませていたが、
        原稿の上端は地より暗い（輝度 12.9 対 23.4）ので、切り口はもともと見えない。
      */}
      <figure
        data-image-role="hero-campaign"
        data-image-ratio="16/9"
        data-hero-frame
        className="pointer-events-none absolute inset-x-0 bottom-0 top-1/2 m-0 md:top-0"
      >
        <div data-hero-image className="absolute inset-0">
          <Image
            src="/images/scenes/hero-weave.webp"
            alt="A handwoven tatami-beri bag standing in the low light of the temple"
            fill
            priority
            sizes="100vw"
            className="object-cover object-right md:object-[62%_42%]"
          />
        </div>
      </figure>

      {/* 紙に覆われる間、写真を落とす層。載せるのは GSAP だけ（初期値は透明）。 */}
      <div
        aria-hidden
        data-hero-dim
        className="pointer-events-none absolute inset-0 z-20 bg-sumi opacity-0"
      />

      {/*
        スマホは下半分が写真なので、版面の下端を 50svh で止める。
        こうすると足元の罫（01 — Honmyoji）が写真の上端に載るキャプションになり、
        作品の上に暗幕を敷かずに済む。md 以上は従来どおり画面の下端まで使う。
      */}
      <div
        data-hero-fade
        className={`${SHELL} relative z-10 flex flex-1 flex-col pt-16 max-md:pb-[50svh] sm:pt-[72px] md:pt-[80px]`}
      >
        {/*
          md 以上は一本の左列 — 縦組みが余白の真ん中に浮き、情報は下端に沈む。
          md 未満は横並び（縦組みが罫の代わりに立ち、その右に見出しと導線）。
        */}
        <div
          data-hero-copy
          className="flex flex-1 items-center gap-7 sm:gap-10 md:flex-col md:items-stretch md:gap-0"
        >
          <div data-hero-ja className="shrink-0 md:my-auto">
            <p
              lang="ja"
              className="tategaki font-jp text-[clamp(15px,1.5vw,21px)] leading-none text-ivory"
            >
              掌に残る、織りの記憶。
            </p>
          </div>

          {/*
            42ch は見出しのための幅。クレジット行（397px）と CTA 行（356px）はそこに
            収まらず二行に折り返していた —— 折り返した meta 行は「そう組んだ」ではなく
            「入りきらなかった」に見える。lg 以上だけ 26rem まで開けて、どちらも一行で
            収める（作品は画面の 57% から先なので、416px は写真に掛からない）。
          */}
          <div className="max-w-[42ch] lg:max-w-[26rem]">
            <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {CREDITS.map((credit, i) => (
                <li
                  key={credit}
                  data-hero-meta
                  className="flex items-center gap-3 font-sans text-[9.5px] uppercase tracking-[0.24em] text-ivory/75"
                >
                  {i > 0 ? <span aria-hidden className="h-px w-3 bg-ivory/35" /> : null}
                  {credit}
                </li>
              ))}
            </ul>

            <h1
              data-hero-title
              className="mt-5 font-display text-[clamp(30px,3.3vw,50px)] font-light leading-[1.04] tracking-[-0.015em] text-ivory max-sm:text-[clamp(34px,9.2vw,42px)] sm:mt-6"
            >
              Made to be
              <br />
              held.
            </h1>

            <div data-hero-cta className="mt-6 flex flex-wrap items-center gap-x-9 gap-y-3 sm:mt-8">
              <Button href="/collection" variant="link-light" arrow>
                Enter the collection
              </Button>
              {/* 二番目は同じ形のまま一段落とす。別の書体や大きさにすると導線が二種類に見える。 */}
              <span className="inline-flex opacity-65 transition-opacity duration-500 hover:opacity-100">
                <Button href={materialHref} variant="link-light">
                  On the material
                </Button>
              </span>
            </div>
          </div>
        </div>

        <div data-hero-rail className="flex items-center gap-4 pb-6 pt-8 md:pb-8">
          <span className="font-sans text-[10px] tabular-nums tracking-[0.2em] text-ivory/70">01</span>
          <span aria-hidden className="h-px w-10 bg-ivory/30 md:w-16" />
          <p className="font-sans text-[9.5px] uppercase leading-[1.8] tracking-[0.22em] text-ivory/70">
            <span className="sm:hidden">Honmyoji · Fuji, Japan</span>
            <span className="hidden sm:inline">{site.location}</span>
          </p>
        </div>
      </div>
    </HomeHeroMotion>
  );
}
