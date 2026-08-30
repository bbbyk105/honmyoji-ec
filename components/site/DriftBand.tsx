"use client";

import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import "@/components/motion/register";

type Shot = { src: string; alt: string };

type Props = {
  /** バッグが主役の写真だけを並べる。風景や堂内のカットはここには置かない。 */
  shots: Shot[];
};

/**
 * 縦に読むと横に動く帯。畳の縁が部屋を一周するように、作品が画面を横切っていく。
 * 動きはスクロール量に紐付ける（自走マーキーにしない）— 読者が止めれば止まる。
 */
export function DriftBand({ shots }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const row = [...shots, ...shots, ...shots];

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.fromTo(
        el.querySelector("[data-drift-shots]"),
        { xPercent: -4 },
        {
          xPercent: -24,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.9 },
        },
      );
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative overflow-hidden py-14 md:py-20" aria-hidden>
      <div data-drift-shots className="flex w-max items-end gap-6 md:gap-10">
        {row.map((shot, i) => (
          <div
            key={`${shot.src}-${i}`}
            className="relative aspect-[4/5] w-[150px] shrink-0 overflow-hidden bg-parchment sm:w-[190px] md:w-[250px]"
            style={{ transform: `translateY(${i % 3 === 1 ? 26 : i % 3 === 2 ? -20 : 0}px)` }}
          >
            <Image src={shot.src} alt="" fill sizes="250px" className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
