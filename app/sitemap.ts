import type { MetadataRoute } from "next";

import { isListed, productImage, productPath, products } from "@/data/products";
import { getBlogPosts } from "@/lib/microcms";
import { absoluteUrl } from "@/lib/seo";

/* 検索エンジン向けの一覧（/sitemap.xml）。作品は data/products.ts で決まり、記事は microCMS から。
   試し買い用（test）は入れない。完売の作品もページは残るので入れる。1 時間ごとに作り直す。 */
export const revalidate = 3600;

const PAGES = ["/", "/collection", "/about", "/blog", "/faq", "/contact", "/legal"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getBlogPosts();
  return [
    ...PAGES.map((path) => ({ url: absoluteUrl(path) })),
    ...products.filter(isListed).map((p) => ({
      url: absoluteUrl(productPath(p)),
      images: Array.from({ length: p.galleryCount }, (_, i) => absoluteUrl(productImage(p.slug, i + 1))),
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      ...(post.date ? { lastModified: post.date } : {}),
    })),
  ];
}
