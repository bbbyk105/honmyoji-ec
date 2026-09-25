import type { Metadata } from "next";
import { Frame } from "@/components/site/Frame";
import { SHELL } from "@/components/site/Shell";
import { getPieces } from "@/lib/catalog";
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
  const named = await getPieces(slugs);
  const productLabel =
    named.length > 0
      ? {
          slug: named.map((p) => p.slug).join(","),
          name: named.map((p) => p.name).join(" · "),
          kanji: named.map((p) => p.kanji).join(" "),
        }
      : null;
  const initialSubject = subjectOptions.some((s) => s.value === subject) ? (subject as string) : "question";

  /* 手紙の用紙なので紙の面（2026-09-25）。入力欄は紙の上に全周の罫で立つ。 */
  return (
    <section className="surface-paper pt-16 sm:pt-[72px] md:pt-[80px]">
      <div className={`${SHELL} pb-pause pt-14 md:pt-24`}>
        {/* 表題は面いっぱいに置き、下の二段組（用件・便箋）と競わせない */}
        <header className="grid gap-8 border-b border-line pb-12 md:grid-cols-12 md:items-end md:gap-8 md:pb-16">
          <div className="md:col-span-6">
            <h1 className="font-display text-display font-light text-ivory">
              Write to
              <br />
              the table.
            </h1>
          </div>
          <p className="max-w-[40ch] font-sans text-body text-bone md:col-span-5 md:col-start-8 md:pb-3">
            To reserve a piece, ask about one, or commission a bag — tell us the shape, size, use and
            colours you have in mind. A person reads every message. A reserved piece is held for a few
            days while payment is arranged.
          </p>
        </header>

        <div className="grid gap-14 pt-14 md:grid-cols-12 md:gap-8 md:pt-20">
          {/* 用紙が先。スマホでは問い合わせフォームを最初に出す */}
          <div className="md:col-span-7 md:col-start-6 md:row-start-1">
            <ContactForm product={productLabel} subject={initialSubject} subjects={subjectOptions} />
          </div>

          <aside className="md:col-span-4 md:col-start-1 md:row-start-1">
            <dl className="space-y-7 font-sans text-small text-bone">
              <div>
                <dt className="font-sans text-meta text-mist">Where</dt>
                <dd className="mt-1.5">{site.location}</dd>
              </div>
              <div>
                <dt className="font-sans text-meta text-mist">Reply</dt>
                <dd className="mt-1.5">Within a day or two, in English or Japanese.</dd>
              </div>
              <div>
                <dt className="font-sans text-meta text-mist">Or write directly</dt>
                <dd className="mt-1.5">
                  <a href={`mailto:${site.email}`} className="link-line text-ivory">
                    {site.email}
                  </a>
                </dd>
              </div>
            </dl>
            <div className="mt-12 max-w-[420px]">
              <Frame
                src="/images/scenes/hands-behind.webp"
                alt="Hands held behind the back, a woven tatami-beri bottle bag hanging from them"
                role="lifestyle"
                ratio="4/5"
                crop="object-cover object-[52%_50%]"
                sizes="(min-width: 768px) 34vw, 100vw"
              />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
