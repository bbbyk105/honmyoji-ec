import type { MetadataRoute } from "next";

import type { BlogPost } from "@/data/blog";
import { isListed, leadSrc, productPath, type Product } from "@/data/products";
import { productImages } from "@/lib/seo";
import { SITE_ORIGIN, siteUrl } from "@/lib/site-url";

/**
 * 検索エンジン向けの URL 一覧を組む。
 *
 * `app/sitemap.ts` が作品（一覧に出るもの）と microCMS の記事を渡す。
 * 試し買い用・管理画面・決済後・下書きは入れない。
 *
 * lastmod は「その URL の HTML を最後に意味のある形で直した日」。
 * 生成のたびに今日の日付を入れると、Google は lastmod を無視し始める。
 * ページの文面を直したら、下の日付も直す。
 */

/** 固定ページの文面を最後に直した日（そのファイルの最終更新）。 */
export const PAGE_LASTMOD = {
  "/": "2026-10-09",
  "/collection": "2026-10-15",
  "/about": "2026-10-15",
  "/blog": "2026-10-15",
  "/faq": "2026-10-15",
  "/contact": "2026-10-15",
  "/legal": "2026-10-09",
} as const;

export const SITEMAP_PAGES = Object.keys(PAGE_LASTMOD) as (keyof typeof PAGE_LASTMOD)[];

/**
 * コード側の作品ページ（写真・名前・区分）を最後に直した日。
 * 管理画面の上書き（`piece_overrides.updated_at`）の方が新しければそちら。
 */
export const CATALOG_LASTMOD = "2026-10-15";

/**
 * トップ・ブログ・作品ページに、各作品へのリンクを足した日。
 * そのページの lastmod は、文面の日付とこれの新しい方。
 */
export const LINKS_LASTMOD = "2026-10-21";

/** リンクを足したので、lastmod を {@link LINKS_LASTMOD} まで進めるページ。一覧は元から全作品へリンクしている。 */
const LINKED_PAGES = new Set<keyof typeof PAGE_LASTMOD>(["/", "/blog"]);

export type SitemapInput = {
  pieces: readonly Product[];
  posts: readonly Pick<BlogPost, "slug" | "date" | "updated">[];
  /** slug → 管理画面が最後に上書きした時刻。無ければコード側の日付。 */
  updatedAt?: ReadonlyMap<string, string>;
};

/** サイトマップに載せる絶対 URL。トップは末尾スラッシュなし（ページの canonical と揃える）。 */
export function sitemapUrl(path: string): string {
  if (path === "/" || path === "") return SITE_ORIGIN;
  const url = siteUrl(path.startsWith("/") ? path : `/${path}`);
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function time(value: string | null | undefined): number {
  if (!value) return Number.NaN;
  const t = Date.parse(value);
  return Number.isNaN(t) ? Number.NaN : t;
}

/** 読める日付のうち、いちばん新しいもの。全部読めなければ fallback。 */
export function latestDate(fallback: string, ...candidates: (string | null | undefined)[]): string {
  let best = fallback;
  let bestTime = time(fallback);
  for (const candidate of candidates) {
    const t = time(candidate);
    if (Number.isNaN(t)) continue;
    if (Number.isNaN(bestTime) || t > bestTime) {
      best = candidate as string;
      bestTime = t;
    }
  }
  return best;
}

export function buildSitemap({ pieces, posts, updatedAt }: SitemapInput): MetadataRoute.Sitemap {
  const pages = SITEMAP_PAGES.map((path) => ({
    url: sitemapUrl(path),
    lastModified: latestDate(PAGE_LASTMOD[path], LINKED_PAGES.has(path) ? LINKS_LASTMOD : undefined),
  }));

  const seen = new Set<string>();
  const products = pieces.flatMap((piece) => {
    if (!isListed(piece) || seen.has(piece.slug)) return [];
    seen.add(piece.slug);
    return [
      {
        url: sitemapUrl(productPath(piece)),
        lastModified: latestDate(CATALOG_LASTMOD, updatedAt?.get(piece.slug), LINKS_LASTMOD),
        images: productImages(piece),
      },
    ];
  });

  const seenPosts = new Set<string>();
  const notes = posts.flatMap((post) => {
    if (!/^[A-Za-z0-9_-]+$/.test(post.slug) || seenPosts.has(post.slug)) return [];
    seenPosts.add(post.slug);
    return [
      {
        url: sitemapUrl(`/blog/${post.slug}`),
        lastModified: latestDate(post.date || LINKS_LASTMOD, post.updated, LINKS_LASTMOD),
      },
    ];
  });

  return [...pages, ...products, ...notes];
}

/** 画像 URL が作品の枚数と一致することの確認用。サイトマップ本体は `productImages`。 */
export function expectedImage(folder: string, n: number): string {
  return siteUrl(leadSrc(folder, n));
}
