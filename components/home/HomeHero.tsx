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

export function HomeHero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const image = root.current?.querySelector<HTMLElement>("[data-hero-image]");
      const title = root.current?.querySelector<HTMLElement>("[data-hero-title]");
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      if (image) {
        tl.from(image, { autoAlpha: 0, scale: 1.04, duration: 2.1, ease: "expo.out" }, 0);
      }

      tl.from(
        "[data-hero-ja]",
        { clipPath: "inset(0% 0% 100% 0%)", duration: 1.45, ease: "expo.out" },
        0.62,
      );

      if (title) {
        const split = SplitText.create(title, { type: "lines", mask: "lines" });
        tl.from(
          split.lines,
          { yPercent: 110, duration: 1.05, stagger: 0.1, ease: "power3.out" },
          0.95,
        );
      }

      tl.from("[data-hero-cta]", { autoAlpha: 0, y: 12, duration: 0.85 }, 1.38).from(
        "[data-hero-rail]",
        { autoAlpha: 0, duration: 0.8 },
        1.58,
      );

      const sheet = document.querySelector<HTMLElement>("[data-page-sheet]");
      if (sheet) {
        const scrub = { trigger: sheet, scrub: true } as const;

        gsap.to("[data-hero-frame]", {
          scale: 1.045,
          ease: "none",
          scrollTrigger: { ...scrub, start: "top bottom", end: "top top" },
        });

        gsap.to("[data-hero-fade]", {
          autoAlpha: 0,
          y: -26,
          ease: "none",
          scrollTrigger: { ...scrub, start: "top 92%", end: "top 34%" },
        });

        gsap.to("[data-hero-dim]", {
          opacity: 0.88,
          ease: "none",
          scrollTrigger: { ...scrub, start: "top 88%", end: "top top" },
        });
      }
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
        className="pointer-events-none absolute inset-x-0 bottom-0 top-1/2 m-0 md:top-0"
      >
        <div data-hero-image className="absolute inset-0">
          <Image
            src="/images/scenes/hero-weave.webp"
            alt="A handwoven tatami-beri bag standing in the low light of Honmyoji Temple"
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

          <div className="max-w-[31rem]">
            <h1
              data-hero-title
              className="font-display text-[clamp(40px,6vw,84px)] font-light leading-[0.94] tracking-[-0.025em] text-ivory max-sm:text-[clamp(38px,10.5vw,48px)]"
            >
              Made once.
              <br />
              Made to be carried.
            </h1>

            <p className="mt-6 max-w-[34ch] font-sans text-[14px] leading-[1.85] text-ivory/72 sm:mt-7">
              One-of-a-kind tatami-beri bags made by hand at Honmyoji Temple in Fuji, Japan.
            </p>

            <div data-hero-cta className="mt-7 sm:mt-9">
              <Button href="/collection" variant="outline-light">
                View the collection
              </Button>
            </div>
          </div>
        </div>

        <div data-hero-rail className="flex items-center gap-4 pb-6 pt-8 md:pb-8">
          <span className="font-sans text-[10px] tabular-nums tracking-[0.2em] text-ivory/65">
            01
          </span>
          <span aria-hidden className="h-px w-10 bg-ivory/25 md:w-16" />
          <p className="font-sans text-[9.5px] uppercase leading-[1.8] tracking-[0.2em] text-ivory/65">
            <span className="sm:hidden">Honmyoji · Fuji, Japan</span>
            <span className="hidden sm:inline">{site.location}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
