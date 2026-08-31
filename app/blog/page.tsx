import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/site/Button";
import { Frame } from "@/components/site/Frame";
import { Reveal } from "@/components/site/Reveal";
import { formatBlogDate, blogMeta } from "@/data/blog";
import { getBlogPosts } from "@/lib/microcms";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes on material, making, care, and place — from Honmyoji Temple, Fuji.",
};

function LeadCopy({
  topic,
  date,
  title,
  titleJa,
  dek,
  slug,
}: {
  topic: string;
  date: string;
  title: string;
  titleJa: string;
  dek: string;
  slug: string;
}) {
  return (
    <>
      <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-mist">
        {blogMeta(topic, formatBlogDate(date))}
      </p>
      <h2 className="mt-4 font-display text-[clamp(30px,3.2vw,40px)] font-light leading-[1.12] text-ink">
        <Link href={`/blog/${slug}`} className="no-underline">
          {title}
        </Link>
      </h2>
      {titleJa ? <p className="mt-2 font-jp text-[12px] tracking-[0.16em] text-mist">{titleJa}</p> : null}
      {dek ? (
        <p className="mt-5 max-w-[42ch] font-sans text-[15px] leading-[1.85] text-charcoal">{dek}</p>
      ) : null}
      <Button href={`/blog/${slug}`} variant="link" className="mt-7">
        Read this note
      </Button>
    </>
  );
}

export default async function BlogIndexPage() {
  const entries = await getBlogPosts();
  const [lead, ...rest] = entries;

  return (
    <section className="pt-16 sm:pt-[72px] md:pt-[80px]">
      <div className="mx-auto w-full max-w-[1480px] px-4 pb-24 pt-12 sm:px-5 sm:pt-14 md:px-8 md:pt-20 lg:px-12">
        <header className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="eyebrow">Blog</p>
            <h1 className="mt-5 font-display text-[clamp(40px,11vw,92px)] font-light leading-[0.94] text-ink">
              Notes from
              <br />
              the table.
            </h1>
            <p className="mt-4 font-jp text-[13px] tracking-[0.22em] text-mist">手記</p>
          </div>
          <p className="max-w-[36ch] font-sans text-[14px] leading-[1.85] text-charcoal/85 md:col-span-4 md:col-start-9">
            Materials, care, the precinct, and how a piece is made once. A small publication, not a
            marketing feed.
          </p>
        </header>

        {/*
          リードは二系統：
          - 写真あり → 横位置（写真6 / 文5）。縦長井戸で見出しが落ちないように。
          - 写真なし → テキストだけの縦組。空の井戸や欠けたグリッドにしない。
        */}
        {lead ? (
          lead.image ? (
            <article className="mt-14 grid gap-8 border-t border-line pt-12 md:mt-16 md:grid-cols-12 md:gap-10">
              <Reveal className="md:col-span-6">
                <Link href={`/blog/${lead.slug}`} className="block no-underline">
                  <Frame
                    src={lead.image}
                    alt={lead.imageAlt}
                    role={lead.imageRole}
                    ratio="5/4"
                    sizes="(min-width: 768px) 48vw, 100vw"
                  />
                </Link>
              </Reveal>
              <Reveal delay={80} className="md:col-span-5 md:col-start-8 md:self-center">
                <LeadCopy
                  topic={lead.topic}
                  date={lead.date}
                  title={lead.title}
                  titleJa={lead.titleJa}
                  dek={lead.dek}
                  slug={lead.slug}
                />
              </Reveal>
            </article>
          ) : (
            <article className="mt-14 max-w-[720px] border-t border-line pt-12 md:mt-16">
              <Reveal>
                <LeadCopy
                  topic={lead.topic}
                  date={lead.date}
                  title={lead.title}
                  titleJa={lead.titleJa}
                  dek={lead.dek}
                  slug={lead.slug}
                />
              </Reveal>
            </article>
          )
        ) : null}

        {rest.length > 0 ? (
          <ol className="mt-16 max-w-[1000px] divide-y divide-line border-y border-line">
            {rest.map((entry, i) => (
              <Reveal key={entry.slug} as="li" delay={i * 50}>
                <Link
                  href={`/blog/${entry.slug}`}
                  className="group grid gap-x-8 gap-y-3 py-8 no-underline md:grid-cols-12"
                >
                  <p className="font-sans text-[10px] uppercase leading-[1.9] tracking-[0.2em] text-mist md:col-span-2">
                    {entry.topic}
                    <span className="block text-mist/75">{formatBlogDate(entry.date)}</span>
                  </p>
                  <div className="md:col-span-9">
                    <h2 className="font-display text-[clamp(24px,2.4vw,30px)] font-light leading-[1.2] text-ink">
                      {entry.title}
                    </h2>
                    {entry.dek ? (
                      <p className="mt-2 max-w-[54ch] font-sans text-[14px] leading-[1.75] text-charcoal/80">
                        {entry.dek}
                      </p>
                    ) : null}
                  </div>
                  <span
                    aria-hidden
                    className="hidden font-sans text-[15px] text-mist transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5 group-hover:text-ink md:col-span-1 md:block md:text-right"
                  >
                    →
                  </span>
                </Link>
              </Reveal>
            ))}
          </ol>
        ) : null}
      </div>
    </section>
  );
}
