"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import { Button } from "@/components/site/Button";
import { Frame } from "@/components/site/Frame";
import { SHELL } from "@/components/site/Shell";
import "@/components/motion/register";

export function HomeHero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const title = root.current?.querySelector("[data-hero-title]");
      const img = root.current?.querySelector("img");
      if (title) {
        const split = SplitText.create(title, { type: "lines", mask: "lines" });
        gsap.from(split.lines, {
          yPercent: 110,
          duration: 1.2,
          stagger: 0.12,
          delay: 0.5,
          ease: "power3.out",
        });
      }

      gsap.from("[data-hero-meta]", {
        y: 18,
        autoAlpha: 0,
        duration: 0.95,
        stagger: 0.08,
        delay: 0.72,
        ease: "power2.out",
      });

      // 像の入場は Frame（reveal="band"）が持つ。ここは離脱時の視差だけ。
      if (img) {
        gsap.to(img, {
          y: 28,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }
    },
    { scope: root },
  );

  return (
    <section ref={root} className="pt-16 sm:pt-[72px] md:pt-[80px]">
      {/* ヒーローも本文と同じ版面に収める。写真だけ外へ出ると、下の全セクションと左右の端が合わない。 */}
      <div className={SHELL}>
        <Frame
          src="/images/scenes/hero-tatami.webp"
          alt="Three tatami-beri bags on the tatami of Honmyoji’s main hall"
          role="hero-campaign"
          ratio="16/10"
          caption="Main hall, afternoon light"
          crop="object-cover object-[50%_58%]"
          reveal="band"
          wellClass="aspect-[4/5] sm:aspect-[5/4] md:aspect-[16/10]"
          priority
          sizes="(min-width: 1480px) 1384px, 100vw"
        >
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/50 via-ink/5 to-ink/15" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-ivory sm:p-8 md:p-12 lg:p-16">
            <p data-hero-meta className="eyebrow text-ivory/70">
              Honmyoji · Fuji City
            </p>
            <h1
              data-hero-title
              className="mt-3 font-display text-[clamp(40px,11vw,96px)] font-light leading-[0.92] tracking-[-0.02em] sm:mt-4"
            >
              Held in
              <br />
              the hand.
            </h1>
            <p data-hero-meta className="mt-3 font-jp text-[12px] tracking-[0.22em] text-ivory/80 sm:mt-4 sm:text-[13px]">
              掌に残る、織りの記憶。
            </p>
            <div data-hero-meta className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 sm:mt-8">
              <Button href="/collection" variant="outline-light" arrow>
                Enter the collection
              </Button>
              <Button href="/journal/the-edge-that-remains" variant="link-light">
                On the material
              </Button>
            </div>
          </div>
        </Frame>
      </div>
    </section>
  );
}
