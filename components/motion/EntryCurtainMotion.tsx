"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { lockScroll } from "@/hooks/useScrollLock";
import { prefersReducedMotion } from "./reduced-motion";
import { EASE, EASE_IN_OUT } from "./tokens";
import "./register";

/**
 * 入場の幕の「動き」だけ。幕の中身（板・名前・罫）は `EntryCurtain`（Server Component）が
 * 描いて children で渡す。ここは `data-entry-*` を探して開くだけなので、字や板を足しても
 * このファイルは変わらない。
 *
 * 所作の理由（割れて退く・二度目は出さない・塗る前に判定する）は `EntryCurtain.tsx` の註。
 */
export function EntryCurtainMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;

      const seen = document.documentElement.dataset.entered !== undefined;

      const mark = () => {
        document.documentElement.dataset.entered = "1";
        try {
          sessionStorage.setItem("miroku-entered", "1");
        } catch {
          /* プライベートウィンドウ。幕が毎回出るだけで、壊れはしない。 */
        }
      };

      /* どちらの場合も幕は CSS で消えている（globals.css）。印だけ付けて何もしない。 */
      if (seen || prefersReducedMotion()) {
        mark();
        return;
      }

      /* 幕が出ているあいだは動かさない。開ききる前に転がすと、明けた先が中途半端な位置になる。 */
      const release = lockScroll();

      const done = () => {
        release();
        gsap.set(el, { display: "none" });
        mark();
        /* 高さを固定していたあいだに測った値を捨てさせる。 */
        ScrollTrigger.refresh();
      };

      const tl = gsap.timeline({ defaults: { ease: EASE }, onComplete: done });

      tl.from("[data-entry-mark]", { yPercent: 115, duration: 1.1 }, 0.1)
        .from("[data-entry-rule]", { scaleX: 0, duration: 1, ease: EASE_IN_OUT }, 0.35)
        .from("[data-entry-meta]", { autoAlpha: 0, duration: 0.8 }, 0.6)
        /* 名前は扉より先に消す。開きながら字を動かすと、割れ目で切られた字が見える。 */
        .to("[data-entry-fade]", { autoAlpha: 0, duration: 0.45, ease: "power2.in" }, 0.95)
        /* 二枚が左右へ退く。等速ではなく、止まりぎわを長く引く。 */
        .to("[data-entry-leaf-left]", { xPercent: -100, duration: 1.05, ease: "power4.inOut" }, 1.1)
        .to("[data-entry-leaf-right]", { xPercent: 100, duration: 1.05, ease: "power4.inOut" }, 1.1);

      /* 開ききる前に外れたとき（/studio へ移ったなど）にロックを置き去りにしない。 */
      return release;
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      aria-hidden
      className="entry-curtain pointer-events-none fixed inset-0 z-[95] overflow-hidden"
    >
      {children}
    </div>
  );
}
