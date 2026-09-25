"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";

import { prefersReducedMotion } from "@/components/motion/reduced-motion";
import "@/components/motion/register";

/**
 * 第一画面の「動き」だけ。写真・縦組み・見出し・導線は `HomeHero`（Server Component）が
 * 描いて children で渡し、ここは `data-hero-*` を探して入場と退場を付ける。
 *
 * 節そのもの（`<section>`）はここが持つ —— useGSAP の scope に要るのと、
 * `data-dark-hero` を SiteHeader が読むため。
 */
export function HomeHeroMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

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
        退場。この節は pin されているので、動くのは上から降りてくる版の面のほう。
        だから「視差」ではなく「部屋が奥へ退く」を作る — 文字は紙の端が届く前に消え、
        写真だけがわずかに寄って暗くなる。黒い版がそのまま上へ抜けるのを避けるための一手。

        trigger は sticky の自分自身ではなく版の面。sticky を trigger にすると、
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
        /* 文字は面が画面の三割まで来た時点で消えている（端で切られる字を作らない）。 */
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
      className="sticky top-0 z-0 isolate flex min-h-[100svh] flex-col overflow-hidden bg-sumi text-ivory"
    >
      {children}
    </section>
  );
}
