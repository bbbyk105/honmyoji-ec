import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/site/Arrow";
import { Button } from "@/components/site/Button";
import { Frame } from "@/components/site/Frame";
import { Reveal } from "@/components/site/Reveal";
import { SHELL } from "@/components/site/Shell";
import { formatBlogDate, blogMeta } from "@/data/blog";
import { getBlogPosts } from "@/lib/microcms";

/** 記事側と同じ行長（`--blog-measure`）。一覧と本文で折り返し位置を揃える。 */
const MEASURE = "max-w-[var(--blog-measure)]";

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
      <p className="font-sans text-meta text-mist">{blogMeta(topic, formatBlogDate(date))}</p>
      <h2 className="mt-4 font-display text-section font-light text-ivory">
        <Link href={`/blog/${slug}`} className="no-underline">
          {title}
        </Link>
      </h2>
      {titleJa ? <p lang="ja" className="mt-3 font-jp text-[14px] tracking-[0.06em] text-mist">{titleJa}</p> : null}
      {dek ? <p className={`mt-6 ${MEASURE} font-sans text-body text-bone`}>{dek}</p> : null}
      <Button href={`/blog/${slug}`} className="mt-8">
        Read this note
      </Button>
    </>
  );
}

export default async function BlogIndexPage() {
  const entries = await getBlogPosts();
  const [lead, ...rest] = entries;

  /* 読むものは紙の面（2026-09-25）。一覧も記事も、同じ紙を繰る。 */
  return (
    <section className="surface-paper pt-16 sm:pt-[72px] md:pt-[80px]">
      <div className={`${SHELL} pb-pause pt-14 md:pt-24`}>
        <header className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <h1 className="font-display text-display font-light text-ivory">
              Notes from
              <br />
              the table.
            </h1>
            <p lang="ja" className="mt-5 font-jp text-[15px] tracking-[0.08em] text-mist">手記</p>
          </div>
          <p className="max-w-[36ch] font-sans text-body text-bone md:col-span-4 md:col-start-9 md:pb-3">
            Materials, care, the temple grounds, and how a piece is made once. A small publication,
            not a marketing feed.
          </p>
        </header>

        {/*
          リードは二系統：
          - 写真あり → 横位置（写真6 / 文5）。縦長井戸で見出しが落ちないように。
          - 写真なし → テキストだけの縦組。空の井戸や欠けたグリッドにしない。
        */}
        {lead ? (
          lead.image ? (
            <article className="mt-lead grid gap-10 border-t border-line pt-14 md:grid-cols-12 md:gap-8">
              <div className="md:col-span-6">
                <Link href={`/blog/${lead.slug}`} className="block no-underline">
                  <Frame
                    src={lead.image}
                    alt={lead.imageAlt}
                    role={lead.imageRole}
                    ratio="5/4"
                    sizes="(min-width: 768px) 48vw, 100vw"
                  />
                </Link>
              </div>
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
            <article className="mt-lead max-w-[760px] border-t border-line pt-14">
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
          <ol className="mt-beat max-w-[1040px] divide-y divide-line border-y border-line">
            {rest.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={`/blog/${entry.slug}`}
                  className="group grid gap-x-8 gap-y-3 py-9 no-underline md:grid-cols-12"
                >
                  <p className="font-sans text-meta text-mist md:col-span-2">
                    {entry.topic}
                    <span className="block">{formatBlogDate(entry.date)}</span>
                  </p>
                  {/*
                    見出しと説明は同じ右端で止める。以前は見出しが 9 カラム（660px）まで
                    流れ、説明だけ 54ch（394px）で折り返していたので、一行読むたびに
                    目の折り返し位置が 270px ずれていた。記事本文と同じ measure に揃える。
                  */}
                  <div className={`md:col-span-9 ${MEASURE}`}>
                    <h2 className="font-display text-title font-light text-ivory">{entry.title}</h2>
                    {entry.dek ? <p className="mt-3 font-sans text-small text-bone">{entry.dek}</p> : null}
                  </div>
                  <span className="hidden justify-end pt-3 text-mist transition-colors duration-500 group-hover:text-ivory md:col-span-1 md:flex">
                    <Arrow className="cta-arrow" />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </section>
  );
}
