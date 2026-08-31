import type { Metadata } from "next";
import { legal } from "@/data/site";

export const metadata: Metadata = {
  title: "Legal — Specified Commercial Transactions Act & Returns",
  description: "Seller information under Japan's Act on Specified Commercial Transactions, and our returns and refund policy.",
};

const rows: { k: string; kJa: string; v: string }[] = [
  { k: "Seller", kJa: "販売事業者", v: legal.seller },
  { k: "Address", kJa: "住所", v: `${legal.address}（${legal.addressJa}）` },
  { k: "Telephone", kJa: "電話番号", v: legal.phone },
  { k: "Responsible person", kJa: "業務の責任者", v: legal.responsible },
  { k: "Prices", kJa: "販売価格", v: legal.price },
  { k: "Shipping", kJa: "送料", v: legal.shipping },
  { k: "Payment", kJa: "支払い方法", v: legal.payment },
  { k: "Delivery", kJa: "引き渡し時期", v: legal.delivery },
];

export default function LegalPage() {
  return (
    <section className="pt-16 sm:pt-[72px] md:pt-[80px]">
      <div className="mx-auto w-full max-w-[1100px] px-4 pt-12 sm:px-5 sm:pt-14 md:px-8 md:pt-20 lg:px-12">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-6 font-display text-[clamp(40px,5vw,68px)] font-light leading-[1.02] text-ink">
          Notice under the Act on Specified Commercial Transactions
        </h1>
        <p className="mt-4 font-jp text-[12px] tracking-[0.3em] text-mist">特定商取引法に基づく表記</p>

        <dl className="mt-14 divide-y divide-line border-t border-line">
          {rows.map((r) => (
            <div key={r.k} className="grid gap-2 py-6 md:grid-cols-[240px_1fr] md:gap-8">
              <dt>
                <span className="block font-sans text-[10.5px] uppercase tracking-[0.3em] text-ink">{r.k}</span>
                <span className="mt-1 block font-jp text-[11px] tracking-[0.16em] text-mist">{r.kJa}</span>
              </dt>
              <dd className="font-sans text-[13px] leading-[1.9] text-charcoal/85">{r.v}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-24 font-display text-[clamp(32px,3.6vw,48px)] font-light leading-[1.1] text-ink">
          {legal.returns.title}
        </h2>
        <p className="mt-3 font-jp text-[12px] tracking-[0.3em] text-mist">{legal.returns.titleJa}</p>
        <div className="mt-10 space-y-8 border-t border-line pt-10">
          {legal.returns.sections.map((s) => (
            <div key={s.h} className="grid gap-2 md:grid-cols-[240px_1fr] md:gap-8">
              <h3 className="font-sans text-[10.5px] uppercase tracking-[0.3em] text-ink">{s.h}</h3>
              <p className="max-w-[64ch] font-sans text-[13px] leading-[1.9] text-charcoal/85">{s.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
