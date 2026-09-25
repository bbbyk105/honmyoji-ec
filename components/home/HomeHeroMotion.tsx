"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";

import { prefersReducedMotion } from "@/components/motion/reduced-motion";
import { DUR, EASE, LINE_STAGGER, TEXT_RISE } from "@/components/motion/tokens";
import "@/components/motion/register";

/**
 * 第一画面の「動き」だけ。写真・見出し・導線は `HomeHero`（Server Component）が
 * 描いて children で渡し、ここは `data-hero-*` を探して入場と退場を付ける。
 * 写真が開く所作は `ImageWell` の `band` が持つので、ここでは写真に触らない。
 *
 * 節そのもの（`<section>`）はここが持つ —— useGSAP の scope に要るのと、
 * `data-dark-hero` を SiteHeader が読むため。
 */
export function HomeHeroMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const title = root.current?.querySelector<HTMLElement>("[data-hero-title]");
      const tl = gsap.timeline({ defaults: { ease: EASE } });
      if (title) {
        const split = SplitText.create(title, { type: "lines", mask: "lines" });
        tl.from(split.lines, { yPercent: 100, duration: DUR.lines, stagger: LINE_STAGGER }, 0.5);
      }
      tl.from("[data-hero-aside]", { autoAlpha: 0, y: TEXT_RISE, duration: DUR.text }, 0.95);

      /*
        退場。この節は pin されているので、動くのは下から上がってくる紙の面のほう。
        文字は面が届く前に消え、写真は**動かさずに**暗くなる —— 節が変わったのではなく
        照明が落ちたように見せる。以前は写真を 1.04 倍へ寄せていたが、紙が上がってくる動きと
        二つ重なるので外した（2026-09-25）。止まっている写真の上を紙が覆うほうが、紙が見える。

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
      className="sticky top-0 z-0 isolate flex min-h-[100svh] flex-col overflow-hidden bg-sumi pt-16 text-ivory sm:pt-[72px] md:pt-[80px] lg:h-[100svh]"
    >
      {children}
    </section>
  );
}
