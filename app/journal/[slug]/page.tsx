import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JournalArticle } from "@/components/journal/JournalArticle";
import { getJournalEntries, getJournalEntry, nextEntry } from "@/lib/microcms";

type Params = { slug: string };

/** microCMS に記事が増えたぶんも静的化する（未設定なら seed の分だけ）。 */
export async function generateStaticParams(): Promise<Params[]> {
  const entries = await getJournalEntries();
  return entries.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getJournalEntry(slug);
  if (!entry) return {};
  return {
    title: entry.title,
    description: entry.dek,
    openGraph: entry.image ? { images: [{ url: entry.image }] } : undefined,
  };
}

export default async function JournalArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const entries = await getJournalEntries();
  const entry = entries.find((e) => e.slug === slug);
  if (!entry) notFound();

  return <JournalArticle entry={entry} next={nextEntry(entries, slug)} />;
}
