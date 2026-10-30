import type { Metadata } from "next";
import { cookies, draftMode } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/blog/BlogArticle";
import { toPieceRefs } from "@/components/collection/PieceIndex";
import { JsonLd } from "@/components/seo/JsonLd";
import { getListedCatalog } from "@/lib/catalog";
import { getBlogPosts, getBlogPost, getBlogDraft, isDraftParam, nextPost } from "@/lib/microcms";
import { PREVIEW_CONTENT_COOKIE, PREVIEW_DRAFT_COOKIE } from "@/lib/preview";
import { blogPostingJsonLd, breadcrumbJsonLd, OPEN_GRAPH_BASE, OPEN_GRAPH_IMAGE } from "@/lib/seo";

type Params = { slug: string };

/** microCMS に記事が増えたぶんも静的化する（未設定なら seed の分だけ）。 */
export async function generateStaticParams(): Promise<Params[]> {
  const entries = await getBlogPosts();
  return entries.map((e) => ({ slug: e.slug }));
}

/**
 * Draft Mode の間で、かつ cookie の対象コンテンツが**この slug**のときだけ
 * draftKey を返す。draftKey は一本の記事にしか効かないので、他の記事の
 * /blog/[slug] まで下書き取得に回すと（取れずに）404 や noindex の "Preview"
 * になる。対象が一致したページだけが下書きの道に入る。
 */
async function draftKeyIfPreviewing(slug: string): Promise<string | undefined> {
  if (!(await draftMode()).isEnabled) return undefined;
  const jar = await cookies();
  const contentId = jar.get(PREVIEW_CONTENT_COOKIE)?.value;
  if (!contentId || !isDraftParam(contentId) || contentId !== slug) return undefined;
  return jar.get(PREVIEW_DRAFT_COOKIE)?.value || undefined;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;

  // プレビュー中は検索に載せない（公開 URL と同じパスで下書きを描くため）。
  // ただし cookie の対象がこの slug のときだけ —— 他の記事は通常のメタに落とす。
  const draftKey = await draftKeyIfPreviewing(slug);
  if (draftKey) {
    return { title: "Preview", robots: { index: false, follow: false } };
  }

  const entry = await getBlogPost(slug);
  if (!entry) return {};
  return {
    title: entry.title,
    description: entry.dek,
    alternates: { canonical: `/blog/${entry.slug}` },
    openGraph: {
      ...OPEN_GRAPH_BASE,
      type: "article",
      title: entry.title,
      description: entry.dek,
      ...(entry.date ? { publishedTime: entry.date } : {}),
      images: [{ url: entry.image ?? OPEN_GRAPH_IMAGE }],
    },
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  // Draft Mode（/api/preview 経由）のときは下書きを draftKey 付きで取り、
  // 構造化データも関連作品も出さない（まだ公開前の一本を見せるだけ）。
  // draftMode を読むこと自体でこの Route は動的になり、ISR/OpenNext の
  // キャッシュに載らない（getBlogDraft は cache: "no-store"）。
  const draftKey = await draftKeyIfPreviewing(slug);
  if (draftKey) {
    const entry = await getBlogDraft(slug, draftKey);
    // 下書きが取れなければ公開版の道に落とす（公開版も無ければ下で notFound()）。
    if (entry) {
      return (
        <>
          {/* 下書きを見ていることが公開ページと見分けが付かない、が一番危ない */}
          <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-sumi px-5 py-3">
            <div className="mx-auto flex max-w-[980px] flex-wrap items-baseline justify-between gap-3">
              <p className="caps text-clay">Draft preview · not published</p>
              <Link href="/api/preview/exit" prefetch={false} className="link-line font-sans text-meta text-mist">
                Leave preview
              </Link>
            </div>
          </div>
          <BlogArticle entry={entry} />
        </>
      );
    }
  }

  const [entries, pieces] = await Promise.all([getBlogPosts(), getListedCatalog()]);
  const entry = entries.find((e) => e.slug === slug);
  if (!entry) notFound();

  return (
    <>
      <BlogArticle entry={entry} next={nextPost(entries, slug)} pieces={toPieceRefs(pieces)} />
      {/* 構造化データは版の後ろに（main の先頭の子を変えない。globals.css の :first-child） */}
      <JsonLd
        data={[
          blogPostingJsonLd(entry),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: entry.title, path: `/blog/${entry.slug}` },
          ]),
        ]}
      />
    </>
  );
}
