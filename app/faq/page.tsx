import type { Metadata } from "next";
import { Button } from "@/components/site/Button";
import { Reveal } from "@/components/site/Reveal";
import { faq } from "@/data/site";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "What is tatami-beri? Is every bag one of a kind? Why the price? Care, durability, custom orders and shipping — answered in English and Japanese.",
};

export default function FaqPage() {
  return (
    <section className="pt-16 sm:pt-[72px] md:pt-[80px]">
      <div className="mx-auto w-full max-w-[1480px] px-4 pt-12 sm:px-5 sm:pt-14 md:px-8 md:pt-20 lg:px-12">
        <div className="grid gap-12 md:grid-cols-[minmax(0,360px)_1fr] md:gap-20">
          <div className="md:sticky md:top-[120px] md:self-start">
            <p className="eyebrow">FAQ</p>
            <h1 className="mt-6 font-display text-[clamp(44px,5.6vw,80px)] font-light leading-[0.98] text-ink">
              Questions,
              <br />
              <em className="italic">answered.</em>
            </h1>
            <p className="mt-4 font-jp text-[12px] tracking-[0.34em] text-mist">よくある質問</p>
            <p className="mt-8 max-w-[36ch] font-sans text-[13px] leading-[2] text-charcoal/80">
              If yours is not here, write to us. A person at the temple answers every message.
            </p>
            <div className="mt-8">
              <Button href="/contact" variant="link" className="text-[10.5px]">
                Contact us
              </Button>
            </div>
          </div>

          <ol className="divide-y divide-line border-t border-line">
            {faq.map((item, i) => (
              <Reveal key={item.q} as="li" delay={Math.min(i, 6) * 40}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-baseline gap-5 py-7 outline-none focus-visible:ring-2 focus-visible:ring-ink/25 md:gap-8">
                    <span className="font-display text-[15px] italic text-mist">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1">
                      <span className="block font-display text-[clamp(22px,2.2vw,28px)] font-light leading-[1.3] text-ink">
                        {item.q}
                      </span>
                      <span className="mt-1.5 block font-jp text-[11.5px] tracking-[0.1em] text-mist">{item.qJa}</span>
                    </span>
                    <span
                      aria-hidden
                      className="relative mt-2 block h-4 w-4 shrink-0 before:absolute before:left-0 before:top-1/2 before:h-px before:w-full before:bg-ink after:absolute after:left-1/2 after:top-0 after:h-full after:w-px after:bg-ink after:transition-transform group-open:after:scale-y-0"
                    />
                  </summary>
                  <div className="grid gap-6 pb-9 pl-[44px] md:grid-cols-2 md:gap-10 md:pl-[60px]">
                    <div className="space-y-4 font-sans text-[13px] leading-[2] text-charcoal/85">
                      {item.a.map((p) => (
                        <p key={p}>{p}</p>
                      ))}
                    </div>
                    <div className="space-y-4 font-jp text-[12.5px] leading-[2.1] text-charcoal/70">
                      {item.aJa.map((p) => (
                        <p key={p}>{p}</p>
                      ))}
                    </div>
                  </div>
                </details>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
