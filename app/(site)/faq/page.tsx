import type { Metadata } from "next";
import { Button } from "@/components/site/Button";
import { SHELL } from "@/components/site/Shell";
import { faq } from "@/data/site";
import { twoDigits } from "@/lib/format";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "What is tatami-beri? Is every bag one of a kind? Why the price? Care, durability, custom orders and shipping — answered in English and Japanese.",
};

export default function FaqPage() {
  /* 読むものなので紙の面。問いの一覧は置いてあるだけで、一問ずつ現れたりしない */
  return (
    <section className="surface-paper pt-16 sm:pt-[72px] md:pt-[80px]">
      <div className={`${SHELL} pb-pause pt-14 md:pt-24`}>
        <div className="grid gap-14 md:grid-cols-[minmax(0,380px)_1fr] md:gap-20">
          <div className="md:sticky md:top-[120px] md:self-start">
            <h1 className="font-display text-display font-light text-ivory">
              Questions,
              <br />
              answered.
            </h1>
            <p lang="ja" className="mt-5 font-jp text-[15px] tracking-[0.08em] text-mist">よくある質問</p>
            <p className="mt-9 max-w-[34ch] font-sans text-body text-bone">
              If yours is not here, write to us. A person at the temple answers every message.
            </p>
            <Button href="/contact" className="mt-8">
              Contact us
            </Button>
          </div>

          <ol className="divide-y divide-line border-t border-line">
            {faq.map((item, i) => (
              <li key={item.q}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-baseline gap-5 py-8 outline-none focus-visible:ring-1 focus-visible:ring-ivory/40 md:gap-8">
                    {/* 番号は固定幅で。本文の sans の数字は等幅にならず、11 番だけ問いの頭がずれた */}
                    <span className="w-6 shrink-0 font-sans text-meta tabular-nums text-mist">
                      {twoDigits(i + 1)}
                    </span>
                    <span className="flex-1">
                      <span className="block font-display text-[clamp(22px,1vw+14px,29px)] font-light leading-[1.28] tracking-[-0.01em] text-ivory">
                        {item.q}
                      </span>
                      <span lang="ja" className="mt-2 block font-jp text-[13px] tracking-[0.04em] text-mist">{item.qJa}</span>
                    </span>
                    <span
                      aria-hidden
                      className="relative mt-2 block h-4 w-4 shrink-0 before:absolute before:left-0 before:top-1/2 before:h-px before:w-full before:bg-ivory after:absolute after:left-1/2 after:top-0 after:h-full after:w-px after:bg-ivory after:transition-transform group-open:after:scale-y-0"
                    />
                  </summary>
                  <div className="grid gap-6 pb-10 pl-[40px] md:grid-cols-2 md:gap-10 md:pl-[56px]">
                    <div className="space-y-4 font-sans text-small text-bone">
                      {item.a.map((p) => (
                        <p key={p}>{p}</p>
                      ))}
                    </div>
                    <div lang="ja" className="space-y-4 font-jp text-[14px] leading-[2.05] text-mist">
                      {item.aJa.map((p) => (
                        <p key={p}>{p}</p>
                      ))}
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
