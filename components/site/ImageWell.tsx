"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import "@/components/motion/register";

export type WellReveal = "wipe" | "band" | "none";

type Props = {
  className?: string;
  /** マスクの中に入る本体（写真）。ここだけが開く。 */
  children: ReactNode;
  /** 見出しやグラデーションなど、マスクの外に置く重ね物。開いている間も動かない。 */
  overlay?: ReactNode;
  reveal?: WellReveal;
};

/**
 * 写真の井戸。写真は「フェードイン」ではなく「開く」。
 *
 *  wipe — 下端から上へマスクが開き、中の像は 1.12 倍から実寸へ落ち着く（スクロール時）
 *  band — 中央の細い帯が左右へ広がって全面になる（読み込み時。ヒーロー用）
 *
 * マスクは井戸そのものではなく内側の層に掛ける。井戸ごと切ると、
 * 上に載せた見出しまで一緒に切れてしまう。
 */
export function ImageWell({ className = "", children, overlay, reveal = "wipe" }: Props) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || reveal === "none") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const mask = el.querySelector<HTMLElement>("[data-well-mask]");
      const img = el.querySelector<HTMLElement>("img");
      if (!mask) return;

      if (reveal === "band") {
        const tl = gsap.timeline();
        tl.fromTo(
          mask,
          { clipPath: "inset(0% 44% 0% 44%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.out" },
        );
        if (img) tl.fromTo(img, { scale: 1.16 }, { scale: 1, duration: 1.9, ease: "expo.out" }, 0);
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" },
      });
      tl.fromTo(
        mask,
        { clipPath: "inset(100% 0% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.25, ease: "expo.out" },
      );
      if (img) tl.fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1.6, ease: "expo.out" }, 0);
    },
    { scope: root, dependencies: [reveal] },
  );

  return (
    <div ref={root} className={className}>
      <div data-well-mask className="absolute inset-0">
        {children}
      </div>
      {overlay}
    </div>
  );
}
