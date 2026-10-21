import type { MetadataRoute } from "next";

import { getListedCatalog, getOverrides } from "@/lib/catalog";
import { getBlogPosts } from "@/lib/microcms";
import { buildSitemap } from "@/lib/sitemap-entries";

/*
  検索エンジン向けの一覧（/sitemap.xml）。
  作品は一覧に出るもの（lib/catalog.ts）。記事は microCMS（getBlogPosts。鍵が無いときだけ seed）。
  試し買い用は入らない。完売の作品もページは残るので入れる。1 時間ごとに作り直す。

  URL は https の正規形（トップは末尾スラッシュなし。ページの canonical と同じ）。
  lastmod は lib/sitemap-entries.ts。無いと、サイトマップで見つかっただけの URL を
  Google が後回しにする（「検出 - インデックス未登録」）。
*/
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pieces, posts, overrides] = await Promise.all([getListedCatalog(), getBlogPosts(), getOverrides()]);
  const updatedAt = new Map<string, string>();
  for (const [slug, row] of overrides) {
    if (row.updated_at) updatedAt.set(slug, row.updated_at);
  }
  return buildSitemap({ pieces, posts, updatedAt });
}
