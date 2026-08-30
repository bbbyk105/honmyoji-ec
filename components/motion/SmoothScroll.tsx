"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "lenis/dist/lenis.css";
import "./register";

const HEADER_OFFSET = 88;

let lenis: Lenis | null = null;
/** Set by popstate so back / forward keeps the reader where they left the page. */
let returningThroughHistory = false;

export function stopLenis() {
  lenis?.stop();
}

export function startLenis() {
  lenis?.start();
}

function jumpToHash(hash: string): boolean {
  const target = hash.length > 1 ? document.querySelector(hash) : null;
  if (!target) return false;
  if (lenis) {
    lenis.scrollTo(target as HTMLElement, { immediate: true, force: true, offset: -HEADER_OFFSET });
  } else {
    target.scrollIntoView();
  }
  return true;
}

function jumpToTop() {
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
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const instance = new Lenis({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.1,
      });
      lenis = instance;

      instance.on("scroll", ScrollTrigger.update);
      const ticker = (time: number) => {
        instance.raf(time * 1000);
      };
      gsap.ticker.add(ticker);
      gsap.ticker.lagSmoothing(0);

      return () => {
        gsap.ticker.remove(ticker);
        instance.destroy();
        if (lenis === instance) lenis = null;
      };
    },
    { dependencies: [] },
  );

  useEffect(() => {
    const onPopState = () => {
      returningThroughHistory = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

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
