"use client";

import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "@/components/motion/reduced-motion";
import "@/components/motion/register";

type Shot = { src: string; alt: string };

type Props = {
  /** バッグが主役の写真だけを並べる。風景や堂内のカットはここには置かない。 */
  shots: Shot[];
  /**
   * 墨の節と紙の節の境目にまたがらせる。上半分が墨、下半分が紙になり、作品の列が
   * 二つの面を縫い合わせる —— 地の色が節ごとに切り替わるだけの縞に見せないため。
   */
  bridge?: boolean;
};

/**
 * 縦に読むと横に動く帯。畳の縁が部屋を一周するように、作品が画面を横切っていく。
 * 動きはスクロール量に紐付ける（自走マーキーにしない）— 読者が止めれば止まる。
 *
 * **写真は一本の床に揃えて立てる**（2026-09-25）。以前は三枚ごとに ±20px ずらしていて、
 * 浮いたカードが波打って流れていくように見えた。作品は同じ床の上に立っている写真なので、
 * 帯の中でも同じ高さに立たせる。
 */
export function DriftBand({ shots, bridge = false }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const row = [...shots, ...shots, ...shots];

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (prefersReducedMotion()) return;

      gsap.fromTo(
        el.querySelector("[data-drift-shots]"),
        { xPercent: -4 },
        {
          xPercent: -18,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 },
        },
      );
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative overflow-hidden" aria-hidden>
      {bridge ? <div className="surface-paper absolute inset-x-0 bottom-0 top-1/2" /> : null}
      <div data-drift-shots className="relative flex w-max items-end gap-5 md:gap-8">
        {row.map((shot, i) => (
          <div
            key={`${shot.src}-${i}`}
            className="relative aspect-[4/5] w-[150px] shrink-0 overflow-hidden bg-sumi sm:w-[190px] md:w-[240px]"
          >
            <Image src={shot.src} alt="" fill sizes="250px" className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
