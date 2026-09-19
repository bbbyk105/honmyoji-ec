import { Button } from "@/components/site/Button";
import { Frame } from "@/components/site/Frame";
import { Reveal } from "@/components/site/Reveal";
import { SHELL } from "@/components/site/Shell";
import { HomeHero } from "@/components/home/HomeHero";
import { FloatingBag } from "@/components/collection/FloatingBag";
import { getCatalog } from "@/lib/catalog";
import { blogHref } from "@/lib/microcms";
import { founder, phrases } from "@/data/site";

export default async function HomePage() {
  const catalog = await getCatalog();
  const sakura = catalog.find((p) => p.folder === "sakura")!;
  const materialHref = await blogHref("the-edge-that-remains", "Materials");

  return (
    <>
      <HomeHero />

      <div
        data-page-sheet
        className="relative z-10 border-t border-ivory/10 bg-sumi shadow-[0_-40px_90px_-40px_rgba(0,0,0,0.85)]"
      >
        {/* Product — the second hero. One object, given enough room to carry the page. */}
        <section className="pt-20 md:pt-32">
          <div className={SHELL}>
            <div className="grid gap-12 md:grid-cols-12 md:items-center md:gap-8">
              <Reveal className="md:col-span-7 lg:col-span-7">
                <FloatingBag product={sakura} priority />
                <p className="mt-4 max-w-[44ch] font-sans text-[13px] leading-[1.8] text-bone/70">
                  {sakura.note}
                </p>
              </Reveal>

              <Reveal
                delay={100}
                className="md:col-span-4 md:col-start-9 lg:col-span-3 lg:col-start-10"
              >
                <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-mist">
                  01 / Collection
                </p>
                <h2
                  data-split-lines
                  className="mt-5 font-display text-[clamp(38px,4.8vw,68px)] font-light leading-[0.98] tracking-[-0.02em] text-ivory"
                >
                  One piece.
                  <br />
                  One encounter.
                </h2>
                <p className="mt-7 max-w-[32ch] font-sans text-[15px] leading-[1.9] text-bone/88">
                  We do not build a season around dozens of near-identical products. Each bag is
                  finished once, photographed as itself, and left to find the person who wants that
                  exact piece.
                </p>
                <p className="mt-5 font-jp text-[12.5px] leading-[2] tracking-[0.12em] text-mist">
                  {phrases.noTwo.ja}
                </p>
                <Button href="/collection" variant="outline" className="mt-9 w-fit">
                  View the collection
                </Button>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Material — one photograph and one essay, with no card-like chrome. */}
        <section className="mt-24 border-y border-line/80 bg-onyx/45 md:mt-36">
          <div className={SHELL + " grid gap-10 py-16 md:grid-cols-12 md:items-center md:gap-10 md:py-24"}>
            <Reveal className="md:col-span-7 lg:col-span-8">
              <Frame
                src="/images/texture/beri-indigo.webp"
                alt="Indigo and moss tatami-beri woven over recycled paper band"
                role="material-macro"
                ratio="4/5"
                caption="Tatami-beri, close"
                wellClass="aspect-[5/4] md:aspect-[16/10]"
                sizes="(min-width: 1024px) 64vw, (min-width: 768px) 58vw, 100vw"
              />
            </Reveal>

            <Reveal
              delay={100}
              className="md:col-span-5 lg:col-span-3 lg:col-start-10"
            >
              <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-mist">
                02 / Material
              </p>
              <h2
                data-split-lines
                className="mt-5 font-display text-[clamp(34px,4vw,54px)] font-light leading-[1.04] text-ivory"
              >
                The edge
                <br />
                that remains.
              </h2>
              <div className="mt-7 max-w-[37ch] space-y-5 font-sans text-[15px] leading-[1.9] text-bone/88">
                <p>
                  Tatami-beri is the woven band sewn around a tatami mat. When a room is remade,
                  lengths of that fabric can be left behind.
                </p>
                <p>
                  At Honmyoji, those remnants meet paper band recycled in Fuji City. What was once
                  an edge becomes the structure of something carried every day.
                </p>
              </div>
              <p className="mt-6 font-jp text-[12.5px] leading-[2] tracking-[0.12em] text-mist">
                {phrases.fabric.ja}
              </p>
              <Button href={materialHref} variant="link" className="mt-7">
                Read the material note
              </Button>
            </Reveal>
          </div>
        </section>

        {/* Story — image first. The copy deliberately overlaps the photograph on wide screens. */}
        <section className={SHELL + " pt-24 md:pt-36"}>
          <div className="relative">
            <Reveal className="md:w-[72%] lg:w-[70%]">
              <Frame
                src="/images/scenes/prayer-altar.webp"
                alt="Finished bags placed before the altar at Honmyoji Temple"
                role="process"
                ratio="3/4"
                caption="Honmyoji Temple · Fuji"
                wellClass="aspect-[4/5] md:aspect-[5/4]"
                sizes="(min-width: 1024px) 66vw, (min-width: 768px) 70vw, 100vw"
              />
            </Reveal>

            <Reveal
              delay={120}
              className="mt-8 border border-line bg-sumi p-7 md:absolute md:right-0 md:top-1/2 md:mt-0 md:w-[40%] md:-translate-y-1/2 md:p-10 lg:w-[36%] lg:p-12"
            >
              <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-mist">
                03 / Honmyoji
              </p>
              <h2
                data-split-lines
                className="mt-5 font-display text-[clamp(34px,4vw,54px)] font-light leading-[1.03] text-ivory"
              >
                Made where
                <br />
                it belongs.
              </h2>
              <div className="mt-7 max-w-[38ch] space-y-5 font-sans text-[15px] leading-[1.9] text-bone/88">
                <p>{founder.handmade.en}</p>
                <p>
                  Each finished piece is set down in the hall before it leaves. The temple is not a
                  theme placed on the product afterwards; it is the place where the work is made.
                </p>
              </div>
              <Button href="/about" variant="outline" className="mt-9 w-fit">
                The maker and the place
              </Button>
            </Reveal>
          </div>
        </section>

        {/* Closing — no banner, no extra module. Just the brand idea and one way forward. */}
        <section className={SHELL + " pb-12 pt-24 md:pb-16 md:pt-36"}>
          <Reveal className="grid gap-10 border-t border-line pt-10 md:grid-cols-12 md:items-end">
            <div className="md:col-span-7">
              <p className="font-display text-[clamp(34px,5vw,72px)] font-light leading-[1.02] tracking-[-0.02em] text-ivory">
                No two bags
                <br />
                are alike.
              </p>
              <p className="mt-5 max-w-[38ch] font-sans text-[14px] leading-[1.85] text-bone/75">
                A material with a past, a pair of hands, and one finished object. Nothing needs to
                be repeated to make the collection feel complete.
              </p>
            </div>
            <div className="md:col-span-3 md:col-start-10 md:justify-self-end">
              <Button href="/collection" variant="link">
                Enter the collection
              </Button>
            </div>
          </Reveal>
        </section>
      </div>
    </>
  );
}
