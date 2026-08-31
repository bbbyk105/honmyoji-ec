import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JournalArticle } from "@/components/journal/JournalArticle";
import { getJournalDraft } from "@/lib/microcms";

/* microCMS の「画面プレビュー」用。管理画面 → API 設定 → 画面プレビューに
   https://<本番ドメイン>/journal/preview?slug={CONTENT_ID}&draftKey={DRAFT_KEY}
   を入れる。下書きは毎回取り直すので静的化しない。 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

type Search = { slug?: string; draftKey?: string };

export default async function JournalPreviewPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { slug, draftKey } = await searchParams;
  if (!slug || !draftKey) notFound();

  const entry = await getJournalDraft(slug, draftKey);
  if (!entry) notFound();

  return (
    <>
      {/* 下書きを見ていることが分からないまま公開ページと見分けが付かない、が一番危ない */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[980px] flex-wrap items-baseline justify-between gap-3">
          <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-clay">
            Draft preview · not published
          </p>
          <Link href="/journal" className="link-line font-sans text-[12px] text-mist">
            Leave preview
          </Link>
        </div>
      </div>
      <JournalArticle entry={entry} />
    </>
  );
}
