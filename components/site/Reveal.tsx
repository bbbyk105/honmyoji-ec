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
  direction?: "up" | "left" | "right" | "none";
  as?: "div" | "section" | "article" | "li" | "p" | "figure";
};

/**
 * 入場。ブロックは静かに上がり、`data-split-lines` を付けた見出しだけは
 * 行ごとにマスクの下から起き上がる（ヒーローと同じ所作を本文の見出しにも使う）。
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  as: Tag = "div",
}: Props) {
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

      const offset =
        direction === "none"
          ? { x: 0, y: 0 }
          : { x: 0, y: 18 };

      tl.from(el, {
        ...offset,
        autoAlpha: 0,
        duration: direction === "none" ? 0.7 : 0.92,
        ease: "power2.out",
      });

      for (const head of heads) {
        const split = SplitText.create(head, { type: "lines", mask: "lines" });
        splits.push(split);
        tl.from(
          split.lines,
          { yPercent: 58, autoAlpha: 0, duration: 0.95, stagger: 0.06, ease: "power3.out" },
          0.04,
        );
      }

      return () => {
        for (const split of splits) split.revert();
      };
    },
    { dependencies: [delay, direction] },
  );

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}

export { ScrollTrigger };
