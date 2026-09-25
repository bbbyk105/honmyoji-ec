"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "lenis/dist/lenis.css";
import "./register";

import { useWindowEvent } from "@/hooks/useWindowEvent";
import { HEADER_OFFSET, getLenis, setLenis } from "./lenis";
import { prefersReducedMotion } from "./reduced-motion";

/*
  止める・動かす・章へ送るは `./lenis` にある（`stopLenis` / `startLenis` / `scrollToChapter`）。
  ここはインスタンスを作って、ページが替わったときの位置を決めるだけ。
*/

/** Set by popstate so back / forward keeps the reader where they left the page. */
let returningThroughHistory = false;

function jumpToHash(hash: string): boolean {
  const target = hash.length > 1 ? document.querySelector(hash) : null;
  if (!target) return false;
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(target as HTMLElement, { immediate: true, force: true, offset: -HEADER_OFFSET });
  } else {
    target.scrollIntoView();
  }
  return true;
}

function jumpToTop() {
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(0, { immediate: true, force: true });
  } else {
    window.scrollTo(0, 0);
  }
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mounted = useRef(false);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const instance = new Lenis({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.1,
      });
      setLenis(instance);

      instance.on("scroll", ScrollTrigger.update);
      const ticker = (time: number) => {
        instance.raf(time * 1000);
      };
      gsap.ticker.add(ticker);
      gsap.ticker.lagSmoothing(0);

      return () => {
        gsap.ticker.remove(ticker);
        instance.destroy();
        if (getLenis() === instance) setLenis(null);
      };
    },
    { dependencies: [] },
  );

  useWindowEvent("popstate", () => {
    returningThroughHistory = true;
  });

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      jumpToHash(window.location.hash);
      ScrollTrigger.refresh();
      return;
    }

    if (returningThroughHistory) {
      returningThroughHistory = false;
    } else if (!jumpToHash(window.location.hash)) {
      jumpToTop();
    }

    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return children;
}
