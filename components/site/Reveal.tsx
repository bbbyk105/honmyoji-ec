"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import "@/components/motion/register";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article" | "li" | "p" | "figure";
};

/**
 * 入場。ブロックは静かに上がり、`data-split-lines` を付けた見出しだけは
 * 行ごとにマスクの下から起き上がる（ヒーローと同じ所作を本文の見出しにも使う）。
 */
export function Reveal({ children, className = "", delay = 0, as: Tag = "div" }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const heads = gsap.utils.toArray<HTMLElement>(el.querySelectorAll("[data-split-lines]"));
      const splits: SplitText[] = [];

      const tl = gsap.timeline({
        delay: delay / 1000,
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          toggleActions: "play none none none",
        },
      });

      tl.from(el, { y: 26, autoAlpha: 0, duration: 1.05, ease: "power3.out" });

      for (const head of heads) {
        const split = SplitText.create(head, { type: "lines", mask: "lines" });
        splits.push(split);
        tl.from(split.lines, { yPercent: 108, duration: 1.1, stagger: 0.09, ease: "power3.out" }, 0.06);
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
