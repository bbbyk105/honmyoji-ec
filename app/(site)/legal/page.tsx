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
    <section className="surface-paper pt-16 sm:pt-[72px] md:pt-[80px]">
      <div className="mx-auto w-full max-w-[1100px] px-4 pb-pause pt-14 sm:px-5 md:px-8 md:pt-24 lg:px-12">
        <h1 className="max-w-[18ch] font-display text-section font-light text-ivory">
          Notice under the Act on Specified Commercial Transactions
        </h1>
        <p lang="ja" className="mt-5 font-jp text-[15px] tracking-[0.06em] text-mist">特定商取引法に基づく表記</p>

        <dl className="mt-lead divide-y divide-line border-t border-line">
          {rows.map((r) => (
            <div key={r.k} className="grid gap-2 py-6 md:grid-cols-[240px_1fr] md:gap-8">
              <dt>
                <span className="block font-sans text-small font-medium text-ivory">{r.k}</span>
                <span lang="ja" className="mt-1 block font-jp text-[13px] tracking-[0.04em] text-mist">{r.kJa}</span>
              </dt>
              <dd className="font-sans text-small text-bone">{r.v}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-pause font-display text-section font-light text-ivory">
          {legal.returns.title}
        </h2>
        <p lang="ja" className="mt-4 font-jp text-[15px] tracking-[0.06em] text-mist">{legal.returns.titleJa}</p>
        <div className="mt-10 space-y-8 border-t border-line pt-10">
          {legal.returns.sections.map((s) => (
            <div key={s.h} className="grid gap-2 md:grid-cols-[240px_1fr] md:gap-8">
              <h3 className="font-sans text-small font-medium text-ivory">{s.h}</h3>
              <p className="max-w-[64ch] font-sans text-small text-bone">{s.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
