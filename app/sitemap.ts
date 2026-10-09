import type { MetadataRoute } from "next";

import { productPath } from "@/data/products";
import { getListedCatalog } from "@/lib/catalog";
import { getBlogPosts } from "@/lib/microcms";
import { productImages } from "@/lib/seo";
import { siteUrl } from "@/lib/site-url";

/* 検索エンジン向けの一覧（/sitemap.xml）。作品は一覧に出るもの（lib/catalog.ts）、記事は microCMS から。
   試し買い用は入らない。完売の作品もページは残るので入れる。1 時間ごとに作り直す。 */
export const revalidate = 3600;

const PAGES = ["/", "/collection", "/about", "/blog", "/faq", "/contact", "/legal"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pieces, posts] = await Promise.all([getListedCatalog(), getBlogPosts()]);
  return [
    ...PAGES.map((path) => ({ url: siteUrl(path) })),
    ...pieces.map((p) => ({ url: siteUrl(productPath(p)), images: productImages(p) })),
    // lastmod は書き直した日（無ければ掲載日）。掲載日のままだと、書き直しても取りに来る合図にならない
    ...posts.map((post) => {
      const lastModified = post.updated ?? post.date;
      return { url: siteUrl(`/blog/${post.slug}`), ...(lastModified ? { lastModified } : {}) };
    }),
  ];
}
