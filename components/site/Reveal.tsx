"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { SplitText } from "gsap/SplitText";
import { prefersReducedMotion } from "@/components/motion/reduced-motion";
import { LINES_FROM, splitLines } from "@/components/motion/split-lines";
import { DUR, EASE, LINE_STAGGER, TEXT_RISE } from "@/components/motion/tokens";
import "@/components/motion/register";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article" | "li" | "p" | "figure";
};

/**
 * 入場。**動くのは節の入口だけ**（2026-09-25）。
 *
 * 以前は一覧の一行・表の一段・FAQ の一問にまで Reveal が付いていて、スクロールするたびに
 * 画面のどこかが必ず動いていた。いまは節の見出しと、その脇の短い文章のブロックだけに使う。
 * 一覧・表・商品の格子は置いてあるだけ —— 静かな部分があるから、動く部分が効く。
 *
 * 節の中の役割分担：
 *   見出し     行ごとにマスクの下から起きる（`data-split-lines`）。clip の中で動くので移動量は見えない
 *   文章       見出しに半拍遅れて、14px 上がりながら現れる
 *   写真       マスクが開く（`ImageWell`）。**フェードは掛けない**
 *
 * 曲線は一つ（`EASE` = easeOutQuint）、長さは 0.9–1.0s（`components/motion/tokens.ts`）。
 *
 * **写真を含むブロックはフェードしない。** 井戸があるブロックでは動かすのはキャプションだけで、
 * 像は `ImageWell` に任せる。写真と文章を一つの Reveal に同居させないこと。
 */
export function Reveal({ children, className = "", delay = 0, as: Tag = "div" }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion()) return;

      const heads = gsap.utils.toArray<HTMLElement>(el.querySelectorAll("[data-split-lines]"));
      const splits: SplitText[] = [];

      const tl = gsap.timeline({
        delay: delay / 1000,
        defaults: { ease: EASE },
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      });

      if (el.querySelector("[data-well-mask]")) {
        const captions = el.querySelectorAll("figcaption");
        if (captions.length > 0) tl.from(captions, { autoAlpha: 0, duration: DUR.text }, 0.45);
      } else if (heads.length > 0) {
        /* 見出しを含まない子だけを、見出しの後から。見出しの行はマスクの中で起こす。 */
        const rest = Array.from(el.children).filter(
          (child) => !child.matches("[data-split-lines]") && !child.querySelector("[data-split-lines]"),
        );
        if (rest.length > 0) {
          tl.from(rest, { autoAlpha: 0, y: TEXT_RISE, duration: DUR.text, stagger: 0.06 }, 0.28);
        }
      } else {
        tl.from(el, { autoAlpha: 0, y: TEXT_RISE, duration: DUR.text });
      }

      for (const head of heads) {
        const split = splitLines(head);
        splits.push(split);
        tl.from(split.lines, { ...LINES_FROM, duration: DUR.lines, stagger: LINE_STAGGER }, 0.04);
      }

      return () => {
        for (const split of splits) split.revert();
      };
    },
    { dependencies: [delay] },
  );

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}

export { ScrollTrigger };
