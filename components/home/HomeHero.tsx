"use client";

import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import { Button } from "@/components/site/Button";
import { SHELL } from "@/components/site/Shell";
import { site } from "@/data/site";
import "@/components/motion/register";

type Props = {
  /** 素材の記事への導線。記事は microCMS 側で入れ替わるので slug を焼き込まない。 */
  materialHref?: string;
};

/** 展示のクレジット。三つ以上並べると帯になるので増やさない。 */
const CREDITS = ["Handwoven", "Tatami-beri / paper band", "One of a kind"];

/**
 * 第一画面。DESIGN.md の「ヒーローは刻まれた写真であって、左コピー / 右写真ではない」は
 * ここでも守っている — 版を割らず、一枚の写真そのものが持つ左の余白に文字を刻む。
 * 写真が暗いので、この節だけ地が warm black になる（下の全セクションは ivory のまま）。
 *
 * 縦組みの一行が主役。英語の見出しは支え。写真は原寸で右に置き、左の余白は空けておく。
 * 版面は SHELL — 写真だけが画面いっぱいに出るので、文字の左端は下のセクションと揃う。
 *
 * この節は `sticky top-0`。下の ivory の面（`[data-page-sheet]`）が z 上位で敷かれていて、
 * スクロールすると紙が下から上がってきてこの部屋を覆う。暗い塊がそのまま上へ抜けると
 * 黒 → 白が切り替えに見えるので、覆われる間に文字を先に消し、部屋を奥へ沈めている。
 */
export function HomeHero({ materialHref = "/blog" }: Props) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const image = root.current?.querySelector<HTMLElement>("[data-hero-image]");
      const title = root.current?.querySelector<HTMLElement>("[data-hero-title]");

      /*
        入場の順は 像 → 縦の一行 → クレジット → 見出し → CTA → 罫。
        写真は「開く」（DESIGN.md）が、全面の帯ワイプはこの大きさでは掃くような動きになるので、
        ここは 1.05 倍からの静かな落ち着きと、縦組みが上から書かれていくマスクに留める。
      */
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      if (image) {
        tl.from(image, { autoAlpha: 0, scale: 1.05, duration: 2.2, ease: "expo.out" }, 0);
      }

      tl.from(
        "[data-hero-ja]",
        { clipPath: "inset(0% 0% 100% 0%)", duration: 1.5, ease: "expo.out" },
        0.7,
      )
        .from("[data-hero-meta]", { autoAlpha: 0, y: 12, duration: 0.9, stagger: 0.09 }, 1.05);

      if (title) {
        const split = SplitText.create(title, { type: "lines", mask: "lines" });
        tl.from(split.lines, { yPercent: 110, duration: 1.1, stagger: 0.1, ease: "power3.out" }, 1.2);
      }

      tl.from("[data-hero-cta]", { autoAlpha: 0, y: 12, duration: 0.9 }, 1.55).from(
        "[data-hero-rail]",
        { autoAlpha: 0, duration: 0.9 },
        1.75,
      );

      /*
        退場。この節は pin されているので、動くのは上から降りてくる ivory の面のほう。
        だから「視差」ではなく「部屋が奥へ退く」を作る — 文字は紙の端が届く前に消え、
        写真だけがわずかに寄って暗くなる。黒い版がそのまま上へ抜けるのを避けるための一手。

        trigger は sticky の自分自身ではなく紙の面。sticky を trigger にすると、
        resize（スマホのアドレスバー開閉）で走る再計測が、貼り付いた現在位置を
        「先頭」と読んでしまい、範囲が丸ごとずれる。
      */
      const sheet = document.querySelector<HTMLElement>("[data-page-sheet]");
      if (sheet) {
        const scrub = { trigger: sheet, scrub: true } as const;

        /*
          写真は動かすのではなく寄る。`[data-hero-image]` を y で送ると、覆われる手前で
          井戸の上端に地の色の帯が出る（pin されているので、その帯が画面に居座る）。
          枠ごと 1.05 倍なら隙間は生まれず、はみ出た分は節の overflow が刈る。
        */
        gsap.to("[data-hero-frame]", {
          scale: 1.05,
          ease: "none",
          scrollTrigger: { ...scrub, start: "top bottom", end: "top top" },
        });
        /* 文字は紙が画面の三割まで来た時点で消えている（端で切られる字を作らない）。 */
        gsap.to("[data-hero-fade]", {
          autoAlpha: 0,
          y: -30,
          ease: "none",
          scrollTrigger: { ...scrub, start: "top 92%", end: "top 32%" },
        });
        gsap.to("[data-hero-dim]", {
          opacity: 0.88,
          ease: "none",
          scrollTrigger: { ...scrub, start: "top 88%", end: "top top" },
        });
      }
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      data-dark-hero
      className="sticky top-0 z-0 isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#1b1710] text-ivory"
    >
      {/*
        写真は画面いっぱい。左に余白のある一枚なので、切らずにそのまま置ける。
        スマホは縦横比が違いすぎて左の余白が消えるため、下半分の帯として敷く。

        帯を 50svh 取ると、原寸 16:9 が縦いっぱいで収まり、作品が丸ごと立つ
        （40% では作品が帯の高さで切れ、その上に足元の暗幕が重なって見えなくなっていた）。
        寄せは右端 — 作品の右の余白は原稿に 5% しかないので、右へ振り切ったときだけ
        左右の余白が釣り合う。上端は地ににじませて切り口を消す。
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
        <div aria-hidden className="hero-seam absolute inset-x-0 top-0 h-28 md:hidden" />
      </figure>

      <div aria-hidden className="hero-veil pointer-events-none absolute inset-0" />
      <div aria-hidden className="hero-grain pointer-events-none absolute inset-0" />

      {/* 紙に覆われる間、部屋を落とす層。載せるのは GSAP だけ（初期値は透明）。 */}
      <div
        aria-hidden
        data-hero-dim
        className="pointer-events-none absolute inset-0 z-20 bg-[#120e08] opacity-0"
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
              className="tategaki font-jp text-[clamp(15px,1.5vw,21px)] leading-none text-ivory/90"
            >
              掌に残る、織りの記憶。
            </p>
          </div>

          <div className="max-w-[42ch]">
            <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {CREDITS.map((credit, i) => (
                <li
                  key={credit}
                  data-hero-meta
                  className="flex items-center gap-3 font-sans text-[9.5px] uppercase tracking-[0.24em] text-ivory/55"
                >
                  {i > 0 ? <span aria-hidden className="h-px w-3 bg-ivory/25" /> : null}
                  {credit}
                </li>
              ))}
            </ul>

            <h1
              data-hero-title
              className="mt-5 font-display text-[clamp(30px,3.3vw,50px)] font-light leading-[1.04] tracking-[-0.015em] text-ivory max-sm:text-[clamp(34px,9.2vw,42px)] sm:mt-6"
            >
              Held in
              <br />
              the hand.
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
          <span className="font-sans text-[10px] tabular-nums tracking-[0.2em] text-ivory/45">01</span>
          <span aria-hidden className="h-px w-10 bg-ivory/20 md:w-16" />
          <p className="font-sans text-[9.5px] uppercase leading-[1.8] tracking-[0.22em] text-ivory/45">
            <span className="sm:hidden">Honmyoji · Fuji, Japan</span>
            <span className="hidden sm:inline">{site.location}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
