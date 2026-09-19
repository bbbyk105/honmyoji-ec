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
  materialHref?: string;
};

/**
 * Heroは「演出を見せる場」ではなく、写真と字組みの第一印象を作る場。
 * 動きは写真が静かに開くことと、文字が数px起きることだけに絞る。
 */
export function HomeHero({ materialHref = "/blog" }: Props) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const image = el.querySelector<HTMLElement>("[data-hero-image]");
      const title = el.querySelector<HTMLElement>("[data-hero-title]");
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (image) {
        tl.fromTo(
          image,
          { autoAlpha: 0, scale: 1.035, clipPath: "inset(0% 7% 0% 0%)" },
          {
            autoAlpha: 1,
            scale: 1,
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.65,
            ease: "expo.out",
          },
          0,
        );
      }

      tl.from("[data-hero-ja]", { autoAlpha: 0, y: 10, duration: 0.9 }, 0.48).from(
        "[data-hero-meta]",
        { autoAlpha: 0, y: 8, duration: 0.75 },
        0.62,
      );

      if (title) {
        const split = SplitText.create(title, { type: "lines", mask: "lines" });
        tl.from(
          split.lines,
          { yPercent: 48, autoAlpha: 0, duration: 1.02, stagger: 0.08, ease: "power3.out" },
          0.72,
        );
      }

      tl.from("[data-hero-cta]", { autoAlpha: 0, y: 8, duration: 0.78 }, 1.02).from(
        "[data-hero-rail]",
        { autoAlpha: 0, duration: 0.75 },
        1.12,
      );

      const sheet = document.querySelector<HTMLElement>("[data-page-sheet]");
      if (sheet) {
        const scrub = { trigger: sheet, scrub: true } as const;

        gsap.to("[data-hero-frame]", {
          scale: 1.022,
          ease: "none",
          scrollTrigger: { ...scrub, start: "top bottom", end: "top top" },
        });
        gsap.to("[data-hero-fade]", {
          autoAlpha: 0,
          y: -16,
          ease: "none",
          scrollTrigger: { ...scrub, start: "top 88%", end: "top 36%" },
        });
        gsap.to("[data-hero-dim]", {
          opacity: 0.74,
          ease: "none",
          scrollTrigger: { ...scrub, start: "top 84%", end: "top top" },
        });
      }
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      data-dark-hero
      className="sticky top-0 z-0 isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#111110] text-ivory"
    >
      <figure
        data-image-role="hero-campaign"
        data-image-ratio="16/9"
        data-hero-frame
        className="pointer-events-none absolute inset-x-0 bottom-0 top-1/2 m-0 overflow-hidden md:top-0"
      >
        <div data-hero-image className="absolute inset-0">
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

      <div
        aria-hidden
        data-hero-dim
        className="pointer-events-none absolute inset-0 z-20 bg-[#090909] opacity-0"
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
              className="tategaki font-jp text-[clamp(14px,1.35vw,19px)] leading-none text-ivory/90"
            >
              掌に残る、織りの記憶。
            </p>
          </div>

          <div className="max-w-[34rem]">
            <p
              data-hero-meta
              className="font-sans text-[10px] font-normal uppercase tracking-[0.18em] text-ivory/68"
            >
              Tatami-beri · Handwoven in Fuji
            </p>

            <h1
              data-hero-title
              className="mt-5 max-w-[10.5ch] font-display text-[clamp(44px,5.4vw,76px)] font-normal leading-[0.94] tracking-[-0.028em] text-ivory max-sm:text-[clamp(42px,10.8vw,54px)] sm:mt-6"
            >
              Made to be
              <br />
              <em className="font-normal italic">held.</em>
            </h1>

            <div data-hero-cta className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3 sm:mt-8">
              <Button href="/collection" variant="link-light" arrow>
                Enter the collection
              </Button>
              <span className="inline-flex opacity-60 transition-opacity duration-500 hover:opacity-100">
                <Button href={materialHref} variant="link-light">
                  On the material
                </Button>
              </span>
            </div>
          </div>
        </div>

        <div data-hero-rail className="flex items-center gap-4 pb-6 pt-8 md:pb-8">
          <span className="font-sans text-[9.5px] tabular-nums tracking-[0.16em] text-ivory/60">
            01
          </span>
          <span aria-hidden className="h-px w-10 bg-ivory/22 md:w-14" />
          <p className="font-sans text-[9.5px] uppercase leading-[1.8] tracking-[0.16em] text-ivory/60">
            <span className="sm:hidden">Honmyoji · Fuji, Japan</span>
            <span className="hidden sm:inline">{site.location}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
