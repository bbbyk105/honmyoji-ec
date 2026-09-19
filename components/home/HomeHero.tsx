"use client";

import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import { Button } from "@/components/site/Button";
import { SHELL } from "@/components/site/Shell";
import { site } from "@/data/site";
import "@/components/motion/register";

type Props = {
  /** 素材の記事への導線。記事は microCMS 側で入れ替わるので slug を焼き込まない。 */
  materialHref?: string;
};

const CREDITS = ["Handwoven", "Tatami-beri / paper band", "One of a kind"];

/**
 * 第一画面は「商品画像 + コピー」ではなく、ブランドのオープニングシークエンスとして扱う。
 * 写真・縦組み・一本の織り線が同じタイミングで立ち上がり、スクロールを始めると
 * 下の版に覆われながら部屋が奥へ沈む。派手な 3D は使わず、写真とタイポの奥行きだけで作る。
 */
export function HomeHero({ materialHref = "/blog" }: Props) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const image = el.querySelector<HTMLElement>("[data-hero-image]");
      const title = el.querySelector<HTMLElement>("[data-hero-title]");
      const thread = el.querySelector<HTMLElement>("[data-hero-thread]");

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      if (image) {
        tl.fromTo(
          image,
          { clipPath: "inset(0% 0% 0% 100%)", scale: 1.085 },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            scale: 1,
            duration: 1.75,
            ease: "expo.inOut",
          },
          0,
        );
      }

      if (thread) {
        tl.fromTo(
          thread,
          { xPercent: -108, autoAlpha: 0 },
          { xPercent: 108, autoAlpha: 1, duration: 1.85, ease: "power4.inOut" },
          0.12,
        ).to(thread, { autoAlpha: 0, duration: 0.42 }, 1.48);
      }

      tl.from(
        "[data-hero-ja]",
        { clipPath: "inset(0% 0% 100% 0%)", duration: 1.35, ease: "expo.out" },
        0.64,
      ).from(
        "[data-hero-meta]",
        { autoAlpha: 0, y: 14, duration: 0.82, stagger: 0.08 },
        0.95,
      );

      if (title) {
        const split = SplitText.create(title, { type: "lines", mask: "lines" });
        tl.from(
          split.lines,
          { yPercent: 116, rotate: 1.4, duration: 1.15, stagger: 0.11, ease: "power4.out" },
          1.05,
        );
      }

      tl.from(
        "[data-hero-cta]",
        { autoAlpha: 0, y: 14, duration: 0.85 },
        1.45,
      ).from(
        "[data-hero-rail]",
        { autoAlpha: 0, duration: 0.85 },
        1.66,
      );

      /*
       * マウスに追従するのは写真だけ。最大 8px 程度に留め、UI が追いかけてくる感じにはしない。
       * スクロール時の frame scale と競合させないため、内側の image layer を動かす。
       */
      const finePointer = window.matchMedia("(pointer: fine)").matches;
      let cleanupPointer = () => {};
      if (finePointer && image) {
        const xTo = gsap.quickTo(image, "x", { duration: 1.2, ease: "power3.out" });
        const yTo = gsap.quickTo(image, "y", { duration: 1.2, ease: "power3.out" });

        const onMove = (event: PointerEvent) => {
          const rect = el.getBoundingClientRect();
          const nx = (event.clientX - rect.left) / rect.width - 0.5;
          const ny = (event.clientY - rect.top) / rect.height - 0.5;
          xTo(nx * 12);
          yTo(ny * 8);
        };
        const onLeave = () => {
          xTo(0);
          yTo(0);
        };

        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerleave", onLeave);
        cleanupPointer = () => {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerleave", onLeave);
        };
      }

      const sheet = document.querySelector<HTMLElement>("[data-page-sheet]");
      if (sheet) {
        const scrub = { trigger: sheet, scrub: true } as const;

        gsap.to("[data-hero-frame]", {
          scale: 1.055,
          ease: "none",
          scrollTrigger: { ...scrub, start: "top bottom", end: "top top" },
        });
        gsap.to("[data-hero-fade]", {
          autoAlpha: 0,
          y: -34,
          ease: "none",
          scrollTrigger: { ...scrub, start: "top 92%", end: "top 30%" },
        });
        gsap.to("[data-hero-dim]", {
          opacity: 0.9,
          ease: "none",
          scrollTrigger: { ...scrub, start: "top 88%", end: "top top" },
        });
      }

      return cleanupPointer;
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      data-dark-hero
      className="sticky top-0 z-0 isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#1b1710] text-ivory"
    >
      <figure
        data-image-role="hero-campaign"
        data-image-ratio="16/9"
        data-hero-frame
        className="pointer-events-none absolute inset-x-0 bottom-0 top-1/2 m-0 overflow-hidden md:top-0"
      >
        <div data-hero-image className="absolute inset-0 will-change-transform">
          <Image
            src="/images/scenes/hero-weave.webp"
            alt="A handwoven tatami-beri bag standing in the low light of the temple"
            fill
            priority
            sizes="100vw"
            className="object-cover object-right md:object-[62%_42%]"
          />
        </div>
      </figure>

      <div aria-hidden className="hero-grain pointer-events-none absolute inset-0" />

      {/* 最初に一本だけ走る「縁」。ローダーではなく、写真を開く合図。 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[47%] z-20 overflow-hidden"
      >
        <span
          data-hero-thread
          className="block h-px w-full bg-ivory/55 opacity-0"
        />
      </div>

      <div
        aria-hidden
        data-hero-dim
        className="pointer-events-none absolute inset-0 z-20 bg-[#120e08] opacity-0"
      />

      <div
        data-hero-fade
        className={SHELL + " relative z-10 flex flex-1 flex-col pt-16 max-md:pb-[50svh] sm:pt-[72px] md:pt-[80px]"}
      >
        <div
          data-hero-copy
          className="flex flex-1 items-center gap-7 sm:gap-10 md:flex-col md:items-stretch md:gap-0"
        >
          <div data-hero-ja className="shrink-0 md:my-auto">
            <p
              lang="ja"
              className="tategaki font-jp text-[clamp(15px,1.5vw,21px)] leading-none text-ivory"
            >
              掌に残る、織りの記憶。
            </p>
          </div>

          <div className="max-w-[44rem]">
            <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {CREDITS.map((credit, i) => (
                <li
                  key={credit}
                  data-hero-meta
                  className="flex items-center gap-3 font-sans text-[9.5px] uppercase tracking-[0.24em] text-ivory/75"
                >
                  {i > 0 ? <span aria-hidden className="h-px w-3 bg-ivory/35" /> : null}
                  {credit}
                </li>
              ))}
            </ul>

            <h1
              data-hero-title
              className="mt-5 max-w-[8.4ch] font-display text-[clamp(44px,6.8vw,102px)] font-light leading-[0.9] tracking-[-0.035em] text-ivory max-sm:text-[clamp(42px,11.5vw,56px)] sm:mt-6"
            >
              Made to
              <br />
              be held.
            </h1>

            <div data-hero-cta className="mt-7 flex flex-wrap items-center gap-x-9 gap-y-3 sm:mt-9">
              <Button href="/collection" variant="link-light" arrow>
                Enter the collection
              </Button>
              <span className="inline-flex opacity-65 transition-opacity duration-500 hover:opacity-100">
                <Button href={materialHref} variant="link-light">
                  On the material
                </Button>
              </span>
            </div>
          </div>
        </div>

        <div data-hero-rail className="flex items-center gap-4 pb-6 pt-8 md:pb-8">
          <span className="font-sans text-[10px] tabular-nums tracking-[0.2em] text-ivory/70">
            01
          </span>
          <span aria-hidden className="h-px w-10 bg-ivory/30 md:w-16" />
          <p className="font-sans text-[9.5px] uppercase leading-[1.8] tracking-[0.22em] text-ivory/70">
            <span className="sm:hidden">Honmyoji · Fuji, Japan</span>
            <span className="hidden sm:inline">{site.location}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
