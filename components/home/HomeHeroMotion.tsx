"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";

import { prefersReducedMotion } from "@/components/motion/reduced-motion";
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
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (title) {
        const split = SplitText.create(title, { type: "lines", mask: "lines" });
        tl.from(split.lines, { yPercent: 110, duration: 1.1, stagger: 0.09 }, 0.55);
      }
      tl.from("[data-hero-aside]", { autoAlpha: 0, duration: 1 }, 1.0);

      /*
        退場。この節は pin されているので、動くのは上から降りてくる版の面のほう。
        文字は面が届く前に消え、写真だけがわずかに寄って暗くなる —— 節が変わったのではなく
        照明が落ちたように見せる。

        trigger は sticky の自分自身ではなく版の面。sticky を trigger にすると、
        resize（スマホのアドレスバー開閉）で走る再計測が、貼り付いた現在位置を
        「先頭」と読んでしまい、範囲が丸ごとずれる。
      */
      const sheet = document.querySelector<HTMLElement>("[data-page-sheet]");
      if (sheet) {
        const scrub = { trigger: sheet, scrub: true } as const;
        gsap.to("[data-hero-frame]", {
          scale: 1.04,
          ease: "none",
          scrollTrigger: { ...scrub, start: "top bottom", end: "top top" },
        });
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
