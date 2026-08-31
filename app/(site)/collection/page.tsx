import type { Metadata } from "next";
import { CollectionStudio } from "@/components/collection/CollectionStudio";
import { phrases } from "@/data/site";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Collection",
  description:
    "Nine one-of-a-kind bags woven from tatami-beri remnants and recycled paper band at Honmyoji Temple, Fuji.",
};

export default async function CollectionPage() {
  const pieces = await getCatalog();

  return (
    <section className="pt-16 sm:pt-[72px] md:pt-[80px]">
      <div className="mx-auto w-full max-w-[1480px] px-4 pb-24 pt-12 sm:px-5 sm:pt-14 md:px-8 md:pt-20 lg:px-12">
        <header className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="eyebrow">Collection · 2026</p>
            <h1 className="mt-5 font-display text-[clamp(40px,11vw,96px)] font-light leading-[0.94] text-ink">
              Nine pieces,
              <br />
              <em className="italic">none repeated.</em>
            </h1>
            <p className="mt-4 font-jp text-[13px] tracking-[0.2em] text-mist">{phrases.noTwo.ja}</p>
          </div>
          <p className="max-w-[38ch] font-sans text-[14px] leading-[1.85] text-charcoal/85 md:col-span-4 md:col-start-9 md:pb-2">
            An exhibition, not a catalogue. Each bag is woven once, from whatever tatami-beri is on
            the table that week. Prices are in Australian dollars, and shipping is included.
          </p>
        </header>

        <div className="mt-14 md:mt-20">
          <CollectionStudio pieces={pieces} />
        </div>

        <dl className="mt-20 grid gap-6 border-t border-line pt-8 font-sans text-[12px] leading-[1.8] text-charcoal/75 md:grid-cols-4">
          <div>
            <dt className="text-[10px] uppercase tracking-[0.2em] text-moss">Available</dt>
            <dd className="mt-2">Ready now, and one of a kind. Add it to your cart and we write back with payment details.</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.2em] text-ink">Reserved</dt>
            <dd className="mt-2">Held for someone who has already written. If payment is not completed, it comes back here.</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.2em] text-indigo">Coming soon</dt>
            <dd className="mt-2">Finished and photographed. Not yet released.</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.2em] text-mist">Sold</dt>
            <dd className="mt-2">Gone for good. We can make something in the same spirit, but never a copy.</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
