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
 * 入場。
 *
 * **ブロックそのものは動かさない。** 以前はここも `y: 26` で上げていたが、同じ瞬間に
 * ブロックが上がり・見出しの行が上がり・写真のマスクが下から開く、と**同じ向きの動きが
 * 三つ重なっていた**（2026-09-20 に数えたら 10 の所作のうち 7 つが「下から上」だった）。
 * 同じ所作の反復は、丁寧ではなく安く見える —— 一節の中で動きが違うから、どれが見出しで
 * どれが写真なのかが動きだけで読める。
 *
 * 節の中の役割分担はこう：
 *   ブロック   静かに現れるだけ（移動しない）
 *   見出し     行ごとにマスクの下から起き上がる ← 縦の所作はここだけ
 *   写真       マスクが開く（`ImageWell`）。**フェードは掛けない**
 *
 * **写真を含むブロックはフェードしない。** DESIGN.md は「写真は開く、フェードしない」と
 * 書いてあるのに、この Reveal が上から `autoAlpha` を掛けていたので、一枚の写真が
 * 「フェード + 寄り + マスク」の三つを同時にやっていた（2026-09-20 に見つけた）。
 * 井戸があるブロックでは、動かすのはキャプションだけにして、像は `ImageWell` に任せる。
 * 写真と文章を一つの Reveal に同居させないこと —— 同居すると文章が素で現れる。
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

      /*
        井戸があるなら、開くのは `ImageWell` の仕事。ここで掛けるのはキャプションだけ
        （像より少し遅れて出る）。無ければブロックごと静かに現れる。移動はしない。
      */
      if (el.querySelector("[data-well-mask]")) {
        const captions = el.querySelectorAll("figcaption");
        if (captions.length > 0) {
          tl.from(captions, { autoAlpha: 0, duration: 0.9, ease: "power2.out" }, 0.45);
        }
      } else {
        tl.from(el, { autoAlpha: 0, duration: 1.1, ease: "power2.out" });
      }

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
