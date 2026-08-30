import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/site/Button";
import { Frame } from "@/components/site/Frame";
import { Reveal } from "@/components/site/Reveal";
import { formatJournalDate, getEntry, journal } from "@/data/journal";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return journal.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = getEntry(slug);
  if (!entry) return {};
  return {
    title: entry.title,
    description: entry.dek,
    openGraph: { images: [{ url: entry.image }] },
  };
}

export default async function JournalArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const entry = getEntry(slug);
  if (!entry) notFound();

  const index = journal.findIndex((e) => e.slug === entry.slug);
  const next = journal[(index + 1) % journal.length];

  return (
    <article className="pt-16 sm:pt-[72px] md:pt-[80px]">
      {/* 記事は最初から最後までひとつの左端に揃える。
          見出しが左端、本文が中央寄せだと、読み始めるたびに視線が横に飛ぶ。 */}
      <header className="mx-auto w-full max-w-[980px] px-5 pt-12 sm:pt-14 md:pt-20">
        <Button href="/journal" variant="link" arrow={false} className="text-mist hover:text-ink">
          Journal
        </Button>
        <p className="eyebrow mt-10">
          {entry.topic} · {entry.season}
        </p>
        <h1 className="mt-4 max-w-[16ch] font-display text-[clamp(38px,5.2vw,68px)] font-light leading-[1.02] text-ink">
          {entry.title}
        </h1>
        <p className="mt-4 font-jp text-[14px] tracking-[0.22em] text-mist">{entry.titleJa}</p>
        <p className="mt-8 max-w-[38ch] font-display text-[clamp(20px,2.1vw,25px)] font-light leading-[1.45] text-charcoal">
          {entry.dek}
        </p>
        <p className="mt-8 border-t border-line pt-5 font-sans text-[11px] uppercase tracking-[0.18em] text-mist">
          {formatJournalDate(entry.date)}
        </p>
        <div className="mt-10">
          <Frame
            src={entry.image}
            alt={entry.imageAlt}
            role={entry.imageRole}
            ratio="16/10"
            caption={entry.imageAlt}
            priority
            sizes="(min-width: 980px) 980px, 100vw"
          />
        </div>
      </header>

      <div className="mx-auto mt-16 w-full max-w-[980px] px-5">
        {entry.pull ? (
          <Reveal>
            <p className="mb-20 max-w-[24ch] font-display text-[clamp(28px,3.4vw,40px)] font-light italic leading-[1.28] text-ink">
              {entry.pull}
            </p>
          </Reveal>
        ) : null}

        <div className="space-y-7">
          {entry.body.map((block, i) => {
            if (block.type === "h" && block.text) {
              return (
                <Reveal key={i}>
                  <h2 className="max-w-[24ch] pt-10 font-display text-[clamp(24px,2.6vw,31px)] font-light leading-[1.2] text-ink">
                    {block.text}
                  </h2>
                </Reveal>
              );
            }
            if (block.type === "image" && block.src) {
              return (
                <Reveal key={i} className="py-8">
                  <figure>
                    <div
                      className={`relative overflow-hidden bg-parchment ${
                        block.ratio === "16/10"
                          ? "aspect-[16/10]"
                          : block.ratio === "1/1"
                            ? "aspect-square"
                            : "aspect-[3/4]"
                      }`}
                    >
                      <Image src={block.src} alt={block.alt ?? ""} fill sizes="(min-width: 980px) 980px, 100vw" className="object-cover" />
                    </div>
                    <figcaption className="mt-3 font-sans text-[10px] uppercase tracking-[0.2em] text-mist">
                      {block.caption}
                    </figcaption>
                  </figure>
                </Reveal>
              );
            }
            if (block.type === "p" && block.text) {
              return (
                <Reveal key={i}>
                  <p className="max-w-[62ch] font-sans text-[17px] leading-[1.9] text-charcoal">{block.text}</p>
                </Reveal>
              );
            }
            return null;
          })}
        </div>
      </div>

      <footer className="mx-auto mt-24 w-full max-w-[980px] px-5">
        <Link
          href={`/journal/${next.slug}`}
          className="group flex items-end justify-between gap-8 border-t border-line py-10 no-underline"
        >
          <span>
            <span className="block font-sans text-[10px] uppercase tracking-[0.24em] text-mist">Next note</span>
            <span className="mt-3 block font-display text-[clamp(26px,3.2vw,38px)] font-light leading-[1.15] text-ink">
              {next.title}
            </span>
            <span className="mt-2 block max-w-[46ch] font-sans text-[13.5px] leading-[1.7] text-charcoal/75">
              {next.dek}
            </span>
          </span>
          <span
            aria-hidden
            className="shrink-0 pb-1 font-sans text-[17px] text-mist transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5 group-hover:text-ink"
          >
            →
          </span>
        </Link>
      </footer>
    </article>
  );
}
