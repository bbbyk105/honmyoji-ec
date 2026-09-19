"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import "@/components/motion/register";

/**
 * トップの黒い版を「止まった背景」にしないための、ごく薄い織りの気配。
 * 装飾を足すのではなく、縦糸・帯がスクロールに対して少しだけずれる。
 * 写真や文字より前には出さない。
 */
export function HomeAtmosphere() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const page = el.parentElement;
      if (!page) return;

      const threadA = el.querySelector<HTMLElement>("[data-thread-a]");
      const threadB = el.querySelector<HTMLElement>("[data-thread-b]");
      const band = el.querySelector<HTMLElement>("[data-thread-band]");

      if (threadA) {
        gsap.fromTo(
          threadA,
          { xPercent: -3 },
          {
            xPercent: 4,
            ease: "none",
            scrollTrigger: {
              trigger: page,
              start: "top top",
              end: "bottom bottom",
              scrub: 1.2,
            },
          },
        );
      }

      if (threadB) {
        gsap.fromTo(
          threadB,
          { xPercent: 3 },
          {
            xPercent: -4,
            ease: "none",
            scrollTrigger: {
              trigger: page,
              start: "top top",
              end: "bottom bottom",
              scrub: 1.5,
            },
          },
        );
      }

      if (band) {
        gsap.fromTo(
          band,
          { xPercent: -1.5, yPercent: -1 },
          {
            xPercent: 2,
            yPercent: 1,
            ease: "none",
            scrollTrigger: {
              trigger: page,
              start: "top top",
              end: "bottom bottom",
              scrub: 1.8,
            },
          },
        );
      }
    },
    { scope: root },
  );

  return (
    <div ref={root} aria-hidden className="home-atmosphere pointer-events-none absolute inset-0 overflow-hidden">
      <span
        data-thread-a
        className="absolute bottom-0 left-[18%] top-0 w-px bg-ivory/[0.025]"
      />
      <span
        data-thread-b
        className="absolute bottom-0 left-[77%] top-0 w-px bg-ivory/[0.02]"
      />
      <span
        data-thread-band
        className="absolute left-[58%] top-[8%] h-[78%] w-[9vw] min-w-20 border-x border-ivory/[0.02]"
      />
    </div>
  );
}
