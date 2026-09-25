"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { prefersReducedMotion } from "@/components/motion/reduced-motion";
import { DUR, EASE, TEXT_RISE } from "@/components/motion/tokens";
import "@/components/motion/register";

/**
 * 入場の幕が左右へ退き始めてから、写真を開き始めるまで（秒）。幕の板は 1.1 秒で動き出し、
 * 2.15 秒で退ききる（`EntryCurtainMotion`）。板と写真のマスクが同じ瞬間に中央から開くと
 * 同じ所作が二重に見えるので、板が半ばまで退いてから、空いた部屋の中で写真が開く。
 */
const AFTER_CURTAIN = 1.45;

/**
 * 第一画面の「動き」だけ。写真・見出し・導線は `HomeHero`（Server Component）が
 * 描いて children で渡し、ここは `data-hero-*` を探して入場と退場を付ける。
 *
 * 入場は三つを順に一度だけ（2026-09-25）:
 *  1. 写真 —— 中央の細い帯が左右へ開く（1.1 秒）。ページの移り変わりと同じ「中央から開く」
 *  2. 見出し —— 14px 下から静かに据わる。一語なので行マスクでは割らない
 *  3. 添え書きと導線 —— 見出しから 140ms 遅れて現れるだけ
 * 以前は写真が 1.4 秒かけて開き、四行の見出しが行ごとにマスクから起きていた。
 *
 * 節そのもの（`<section>`）はここが持つ —— useGSAP の scope に要るのと、
 * `data-dark-hero` を SiteHeader が読むため。
 */
export function HomeHeroMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      /*
        幕が出ている（この訪問で初めてサイトに入った）かどうか。印は幕自身が退ききってから付けるので、
        いま付いていなければ幕が上に掛かっている。二度目以降は SiteChrome の一行が塗る前に付けている。
      */
      const behindCurtain = document.documentElement.dataset.entered === undefined;

      const tl = gsap.timeline({ defaults: { ease: EASE }, delay: behindCurtain ? AFTER_CURTAIN : 0.1 });
      tl.fromTo(
        "[data-hero-mask]",
        { clipPath: "inset(0% 44% 0% 44%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: DUR.image },
        0,
      )
        /* 終わりの値を明示する（`from` にしない）。開く前の姿は CSS も置いている（globals.css の Home hero） */
        .fromTo(
          "[data-hero-title]",
          { autoAlpha: 0, y: TEXT_RISE },
          { autoAlpha: 1, y: 0, duration: DUR.lines },
          0.55,
        )
        .fromTo("[data-hero-aside]", { autoAlpha: 0 }, { autoAlpha: 1, duration: DUR.text }, 0.69);

      /*
        退場。この節は pin されているので、動くのは下から上がってくる紙の面のほう。
        文字は面が届く前に消え、写真は**動かさずに**暗くなる —— 節が変わったのではなく
        照明が落ちたように見せる。写真の視差も付けない（止まっている写真の上を紙が覆うほうが、紙が見える）。

        trigger は sticky の自分自身ではなく版の面。sticky を trigger にすると、
        resize（スマホのアドレスバー開閉）で走る再計測が、貼り付いた現在位置を
        「先頭」と読んでしまい、範囲が丸ごとずれる。
      */
      const sheet = document.querySelector<HTMLElement>("[data-page-sheet]");
      if (sheet) {
        const scrub = { trigger: sheet, scrub: true } as const;
        gsap.to("[data-hero-fade]", {
          autoAlpha: 0,
          ease: "none",
          scrollTrigger: { ...scrub, start: "top 96%", end: "top 55%" },
        });
        gsap.to("[data-hero-dim]", {
          opacity: 0.85,
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
      /*
        上の余白はヘッダーの高さ + 12〜20px（写真の上端がヘッダーのすぐ下に来る）。
        **sticky は画面が 560px 以上あるときだけ**。貼り付いた節が画面より高いと、はみ出した下の部分は
        紙に覆われるまで一度も見えない（横向きのスマホ）。低い画面では普通に流れる節にする。
      */
      className="relative z-0 isolate flex min-h-[100svh] flex-col overflow-hidden bg-sumi pt-[76px] text-ivory sm:pt-[84px] md:pt-24 lg:pb-8 lg:pt-[100px] [@media(min-height:560px)]:sticky [@media(min-height:560px)]:top-0 [@media(min-height:560px)]:h-[100svh]"
    >
      {children}
    </section>
  );
}
