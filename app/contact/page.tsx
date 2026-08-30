import type { Metadata } from "next";
import { Frame } from "@/components/site/Frame";
import { getProduct } from "@/data/products";
import { site } from "@/data/site";
import { subjectOptions } from "./subjects";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reserve a piece, ask a question, or commission a bag from Honmyoji Temple.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; subject?: string }>;
}) {
  const { product: slug, subject } = await searchParams;
  const slugs = slug ? slug.split(",").filter(Boolean) : [];
  const named = slugs.map((s) => getProduct(s)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const productLabel =
    named.length > 0
      ? {
          slug: named.map((p) => p.slug).join(","),
          name: named.map((p) => p.name).join(" · "),
          kanji: named.map((p) => p.kanji).join(" "),
        }
      : null;
  const initialSubject = subjectOptions.some((s) => s.value === subject) ? (subject as string) : "question";

  return (
    <section className="pt-16 sm:pt-[72px] md:pt-[80px]">
      <div className="mx-auto w-full max-w-[1480px] px-4 pb-24 pt-12 sm:px-5 sm:pt-14 md:px-8 md:pt-20 lg:px-12">
        {/* 表題は面いっぱいに置き、下の二段組（用件・便箋）と競わせない */}
        <header className="grid gap-6 border-b border-line pb-10 md:grid-cols-12 md:items-end md:gap-10 md:pb-12">
          <div className="md:col-span-6">
            <p className="eyebrow">Contact</p>
            <h1 className="mt-5 font-display text-[clamp(40px,6vw,76px)] font-light leading-[0.98] text-ink">
              Write to
              <br />
              the table.
            </h1>
            <p className="mt-4 font-jp text-[12px] tracking-[0.28em] text-mist">お問い合わせ</p>
          </div>
          <p className="max-w-[44ch] font-sans text-[15px] leading-[1.85] text-charcoal md:col-span-5 md:col-start-8 md:pb-2">
            To hold a piece, ask about one, or commission a bag — shape, size, use, colours. A person
            answers. Reserved pieces wait a few days while payment is arranged.
          </p>
        </header>

        <div className="grid gap-12 pt-12 md:grid-cols-12 md:gap-10 md:pt-16">
          {/* 用紙が先。スマホでは問い合わせフォームを最初に出す */}
          <div className="md:col-span-7 md:col-start-6 md:row-start-1">
            <ContactForm product={productLabel} subject={initialSubject} subjects={subjectOptions} />
          </div>

          <aside className="md:col-span-4 md:col-start-1 md:row-start-1">
            <dl className="space-y-6 font-sans text-[14px] leading-[1.8] text-charcoal">
              <div>
                <dt className="font-sans text-[11px] font-medium uppercase tracking-[0.16em] text-mist">Where</dt>
                <dd className="mt-1.5">{site.location}</dd>
              </div>
              <div>
                <dt className="font-sans text-[11px] font-medium uppercase tracking-[0.16em] text-mist">Reply</dt>
                <dd className="mt-1.5">Within a day or two, in English or Japanese.</dd>
              </div>
              <div>
                <dt className="font-sans text-[11px] font-medium uppercase tracking-[0.16em] text-mist">Or write directly</dt>
                <dd className="mt-1.5">
                  <a href={`mailto:${site.email}`} className="link-line text-ink">
                    {site.email}
                  </a>
                </dd>
              </div>
            </dl>
            <div className="mt-10">
              <Frame
                src="/images/scenes/sakura-branch.webp"
                alt="Cherry branches at the temple entrance"
                role="lifestyle"
                ratio="16/10"
                caption="Entrance, spring"
                sizes="(min-width: 768px) 34vw, 100vw"
              />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
