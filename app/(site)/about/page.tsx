import type { Metadata } from "next";
import { Button } from "@/components/site/Button";
import { Frame } from "@/components/site/Frame";
import { Reveal } from "@/components/site/Reveal";
import { faq, founder, phrases } from "@/data/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "MIROKU is made at Honmyoji Temple in Fuji City by Emi Kashiwazake — tatami-beri remnants, recycled paper band, one piece at a time.",
};

export default function AboutPage() {
  return (
    <>
      <section className="pt-16 sm:pt-[72px] md:pt-[80px]">
        <div className="mx-auto grid w-full max-w-[1480px] gap-10 px-4 pt-12 sm:px-5 sm:pt-14 md:grid-cols-12 md:items-end md:px-8 md:pt-20 lg:px-12">
          <div className="md:col-span-6">
            <p className="eyebrow">About</p>
            <h1 className="mt-5 font-display text-[clamp(40px,5.8vw,80px)] font-light leading-[0.98] text-ink">
              A temple table,
              <br />
              a leftover edge.
            </h1>
            <p className="mt-4 font-jp text-[13px] tracking-[0.22em] text-mist">{phrases.shine.ja}</p>
          </div>
          <p className="max-w-[40ch] font-sans text-[15px] leading-[1.85] text-charcoal/85 md:col-span-5 md:col-start-8 md:pb-2">
            MIROKU is a small making practice at Honmyoji, Fuji City. Bags are woven one by one from
            tatami-beri remnants and paper band recycled in the same city. Not a line. A sequence of
            encounters.
          </p>
        </div>
        <div className="mt-12 px-4 md:px-6 lg:px-8">
          <Frame
            src="/images/scenes/kimono-corridor.webp"
            alt="The corridor of Honmyoji, kimono and bag"
            role="lifestyle"
            ratio="16/10"
            caption="Honmyoji corridor"
            crop="object-cover object-[45%_50%]"
            priority
            sizes="100vw"
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] px-5 pt-20 md:px-8 md:pt-28 lg:px-12">
        <div className="grid gap-12 md:grid-cols-12 md:gap-10">
          <Reveal delay={100} className="md:col-span-6">
            <p className="eyebrow">Maker</p>
            <h2 className="mt-4 font-display text-[clamp(34px,4vw,50px)] font-light leading-[1.05] text-ink">
              {founder.name}
            </h2>
            <p className="mt-3 font-jp text-[14px] tracking-[0.24em] text-mist">{founder.nameJa}</p>
            <p className="mt-4 font-sans text-[13px] leading-[1.8] text-mist">{founder.title}</p>

            <h3 className="mt-12 font-display text-[clamp(24px,2.6vw,32px)] font-light leading-[1.15] text-ink">
              How the bag began
            </h3>
            <div className="mt-6 max-w-[56ch] space-y-5 font-sans text-[15.5px] leading-[1.9] text-charcoal">
              {founder.origin.en.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <div className="mt-8 max-w-[36em] space-y-4 border-t border-line pt-8 font-jp text-[13px] leading-[2] text-mist">
              {founder.origin.ja.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </Reveal>

          {/* 年表は左の細い列に押し込まず、独立した「経歴」として読ませる */}
          <Reveal className="md:col-span-6 md:col-start-7">
            <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-mist">Practice</p>
            <dl className="mt-6 border-t border-line">
              {founder.timeline.map((t) => (
                <div key={t.years} className="grid gap-x-8 gap-y-2 border-b border-line py-6 sm:grid-cols-[88px_1fr]">
                  <dt className="font-display text-[16px] italic leading-[1.6] text-moss">{t.years}</dt>
                  <dd className="max-w-[54ch] font-sans text-[14px] leading-[1.85] text-charcoal/90">{t.en}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto mt-20 grid w-full max-w-[1480px] gap-8 px-5 md:grid-cols-12 md:px-8 lg:px-12">
        <Reveal className="md:col-span-5">
          <Frame
            src="/images/scenes/bamboo-trio.webp"
            alt="Three bags in the bamboo grove"
            role="lifestyle"
            ratio="3/4"
            caption="Grove behind the hall"
            sizes="(min-width: 768px) 40vw, 100vw"
          />
        </Reveal>
        <Reveal delay={80} className="flex flex-col justify-center md:col-span-5 md:col-start-8">
          <p className="eyebrow">Material philosophy</p>
          <h3 className="mt-4 font-display text-[clamp(28px,3vw,38px)] font-light leading-[1.15] text-ink">
            {founder.reasons.title}
          </h3>
          <p className="mt-2 font-jp text-[12px] tracking-[0.18em] text-mist">{founder.reasons.titleJa}</p>
          <ul className="mt-8 space-y-6">
            {founder.reasons.en.map((r) => (
              <li key={r} className="max-w-[52ch] font-sans text-[15.5px] leading-[1.85] text-charcoal">
                {r}
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section className="mx-auto mt-20 grid w-full max-w-[1480px] gap-10 px-5 md:grid-cols-12 md:px-8 md:pt-8 lg:px-12">
        <Reveal className="order-2 flex flex-col justify-center md:order-1 md:col-span-5">
          <p className="eyebrow">Place</p>
          <h3 className="mt-4 font-display text-[clamp(28px,3.2vw,40px)] font-light leading-[1.1] text-ink">
            Made in a working temple.
          </h3>
          <p className="mt-3 font-jp text-[13px] tracking-[0.18em] text-mist">お寺で、ひとつずつ。</p>
          <div className="mt-8 max-w-[52ch] space-y-5 font-sans text-[15.5px] leading-[1.9] text-charcoal">
            <p>{faq[5].a[0]}</p>
            <p>{faq[5].a[1]}</p>
            <p>
              {faq[6].a[0]} {faq[6].a[1]}
            </p>
          </div>
        </Reveal>
        <Reveal delay={80} className="order-1 md:order-2 md:col-span-6 md:col-start-7">
          <Frame
            src="/images/scenes/temple-hall.webp"
            alt="The main hall of Honmyoji"
            role="process"
            ratio="4/5"
            caption="Main hall"
            sizes="(min-width: 768px) 45vw, 100vw"
          />
        </Reveal>
      </section>

      <section className="mx-auto mt-16 grid w-full max-w-[1480px] grid-cols-2 gap-4 px-5 md:grid-cols-12 md:gap-5 md:px-8 lg:px-12">
        <Reveal className="md:col-span-6">
          <Frame
            src="/images/scenes/water-basin.webp"
            alt="Water basin in the temple garden"
            role="process"
            ratio="1/1"
            caption="Garden basin"
            sizes="(min-width: 768px) 48vw, 50vw"
          />
        </Reveal>
        <Reveal delay={80} className="md:col-span-6">
          <Frame
            src="/images/scenes/fuji.webp"
            alt="Mount Fuji from Fuji City"
            role="lifestyle"
            ratio="1/1"
            caption="The mountain, when it shows"
            sizes="(min-width: 768px) 48vw, 50vw"
          />
        </Reveal>
      </section>

      <section className="mx-auto w-full max-w-[1480px] px-5 py-24 md:px-8 md:py-32 lg:px-12">
        {/* 締めも二段組にする。一本の細い柱だけ立てると、右に版面の半分が空く */}
        <div className="grid gap-10 border-t border-line pt-12 md:grid-cols-12">
          <Reveal className="md:col-span-5">
            <p className="eyebrow">Close</p>
            <h2 className="mt-4 font-display text-[clamp(30px,3.6vw,46px)] font-light leading-[1.12] text-ink">
              {founder.handmade.title}
            </h2>
            <p className="mt-4 font-jp text-[16px] tracking-[0.28em] text-mist">{founder.handmade.titleJa}</p>
            <Button href="/collection" variant="outline" className="mt-10">
              The collection
            </Button>
          </Reveal>
          <Reveal delay={90} className="md:col-span-6 md:col-start-7">
            <p className="max-w-[56ch] font-sans text-[16px] leading-[1.9] text-charcoal">{founder.handmade.en}</p>
            <p className="mt-12 max-w-[30ch] font-display text-[clamp(24px,2.8vw,32px)] font-light italic leading-[1.35] text-ink">
              {founder.message.en}
            </p>
            <p className="mt-6 font-sans text-[11px] uppercase tracking-[0.22em] text-mist">— {founder.name}</p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
