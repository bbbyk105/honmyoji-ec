import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/blog/BlogArticle";
import { JsonLd } from "@/components/seo/JsonLd";
import { getBlogPosts, getBlogPost, nextPost } from "@/lib/microcms";
import { blogPostingJsonLd, breadcrumbJsonLd, OPEN_GRAPH_BASE, OPEN_GRAPH_IMAGE } from "@/lib/seo";

type Params = { slug: string };

/** microCMS に記事が増えたぶんも静的化する（未設定なら seed の分だけ）。 */
export async function generateStaticParams(): Promise<Params[]> {
  const entries = await getBlogPosts();
  return entries.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
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
  const entries = await getBlogPosts();
  const entry = entries.find((e) => e.slug === slug);
  if (!entry) notFound();

  return (
    <>
      <BlogArticle entry={entry} next={nextPost(entries, slug)} />
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
