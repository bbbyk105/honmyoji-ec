/**
 * @jest-environment node
 */

export {};

jest.mock("server-only", () => ({}));

import { products } from "@/data/products";
import { otherInLine } from "@/lib/piece-links";
import { SITE_ORIGIN } from "@/lib/site-url";
import {
  buildSitemap,
  CATALOG_LASTMOD,
  expectedImage,
  latestDate,
  LINKS_LASTMOD,
  sitemapUrl,
} from "@/lib/sitemap-entries";

const posts = [
  { slug: "welcome", date: "2026-08-01", updated: "2026-08-31T03:50:37.435Z" },
  { slug: "tatami-beri-bags-from-honmyoji", date: "2026-09-01", updated: "2026-09-19T18:38:41.069Z" },
];

function urls(entries: { url: string }[]): string[] {
  return entries.map((entry) => entry.url);
}

describe("sitemapUrl", () => {
  it("トップは末尾スラッシュなしの https（ページの canonical と同じ）", () => {
    expect(sitemapUrl("/")).toBe(SITE_ORIGIN);
    expect(sitemapUrl("/")).not.toMatch(/\/$/);
    expect(sitemapUrl("/")).toMatch(/^https:\/\//);
  });

  it("下のページも https で、末尾スラッシュを付けない", () => {
    expect(sitemapUrl("/collection/ai-indigo")).toBe(`${SITE_ORIGIN}/collection/ai-indigo`);
    expect(sitemapUrl("blog/welcome")).toBe(`${SITE_ORIGIN}/blog/welcome`);
  });
});

describe("buildSitemap", () => {
  const listed = products.filter((piece) => !piece.test);
  const testPiece = { ...products[0], slug: "test-purchase", folder: "test-01", test: true, galleryCount: 1 };
  const entries = buildSitemap({ pieces: [...listed, testPiece], posts });

  it("主要ページ・全作品・microCMS の記事を入れ、試し買い用と管理画面は入れない", () => {
    const list = urls(entries);
    for (const path of ["/", "/collection", "/about", "/blog", "/faq", "/contact", "/legal"]) {
      expect(list).toContain(sitemapUrl(path));
    }
    for (const piece of listed) {
      expect(list).toContain(`${SITE_ORIGIN}/collection/${piece.slug}`);
    }
    expect(list).toContain(`${SITE_ORIGIN}/blog/welcome`);
    expect(list).toContain(`${SITE_ORIGIN}/blog/tatami-beri-bags-from-honmyoji`);
    expect(list).not.toContain(`${SITE_ORIGIN}/collection/test-purchase`);
    for (const blocked of ["/studio", "/api", "/checkout/thank-you", "/blog/preview", "/journal"]) {
      expect(list.some((url) => url.includes(blocked))).toBe(false);
    }
  });

  it("全部 https で、クエリも末尾スラッシュも無く、lastmod がある", () => {
    expect(entries.length).toBe(7 + listed.length + posts.length);
    for (const entry of entries) {
      const url = new URL(entry.url);
      expect(url.protocol).toBe("https:");
      expect(url.search).toBe("");
      expect(url.hash).toBe("");
      expect(url.pathname.endsWith("/") && url.pathname !== "/").toBe(false);
      expect(entry.lastModified).toBeTruthy();
    }
    const home = entries.find((entry) => entry.url === SITE_ORIGIN);
    expect(home?.url.endsWith("/")).toBe(false);
  });

  it("記事の lastmod は、リンクを足した日と microCMS の更新日の新しい方", () => {
    const welcome = entries.find((entry) => entry.url.endsWith("/blog/welcome"));
    expect(welcome?.lastModified).toBe(latestDate(LINKS_LASTMOD, "2026-08-31T03:50:37.435Z"));
    const newer = buildSitemap({
      pieces: [],
      posts: [{ slug: "welcome", date: "2026-08-01", updated: "2026-11-02T00:00:00.000Z" }],
    });
    expect(newer[newer.length - 1]?.lastModified).toBe("2026-11-02T00:00:00.000Z");
  });

  it("作品の lastmod は、コード側・上書き・リンクを足した日の新しい方", () => {
    const piece = listed[0];
    const older = buildSitemap({
      pieces: [piece],
      posts: [],
      updatedAt: new Map([[piece.slug, "2026-09-01T00:00:00.000Z"]]),
    });
    const product = older.find((entry) => entry.url.endsWith(`/collection/${piece.slug}`));
    expect(product?.lastModified).toBe(latestDate(CATALOG_LASTMOD, "2026-09-01T00:00:00.000Z", LINKS_LASTMOD));
    const newer = buildSitemap({
      pieces: [piece],
      posts: [],
      updatedAt: new Map([[piece.slug, "2026-12-01T00:00:00.000Z"]]),
    });
    expect(newer.find((entry) => entry.url.endsWith(`/collection/${piece.slug}`))?.lastModified).toBe(
      "2026-12-01T00:00:00.000Z",
    );
  });

  it("作品の画像は https の絶対 URL で、枚数と一致する", () => {
    const piece = listed.find((item) => item.galleryCount > 1)!;
    const entry = entries.find((item) => item.url.endsWith(`/collection/${piece.slug}`));
    expect(entry?.images).toHaveLength(piece.galleryCount);
    expect(entry?.images?.[0]).toBe(expectedImage(piece.folder, 1));
    expect(entry?.images?.every((src) => src.startsWith("https://"))).toBe(true);
  });

  it("slug が空やパス区切りの記事は入れない", () => {
    const bad = buildSitemap({
      pieces: [],
      posts: [
        { slug: "../blogs", date: "2026-01-01" },
        { slug: "", date: "2026-01-01" },
        { slug: "ok-note", date: "2026-01-01" },
      ],
    });
    const dupes = buildSitemap({
      pieces: [],
      posts: [
        { slug: "ok-note", date: "2026-01-01" },
        { slug: "ok-note", date: "2026-02-01" },
      ],
    });
    expect(urls(bad).filter((url) => url.includes("/blog/"))).toEqual([`${SITE_ORIGIN}/blog/ok-note`]);
    expect(urls(dupes).filter((url) => url.includes("/blog/"))).toEqual([`${SITE_ORIGIN}/blog/ok-note`]);
  });
});

describe("otherInLine", () => {
  it("同じ区分の他の作品を、カタログの順ですべて返す", () => {
    const bottles = products.filter((piece) => piece.line === "tatami-beri" && !piece.test);
    const others = otherInLine(products, bottles[0]);
    expect(others).toHaveLength(bottles.length - 1);
    expect(others.map((piece) => piece.slug)).toEqual(bottles.slice(1).map((piece) => piece.slug));
    expect(others.some((piece) => piece.line !== "tatami-beri")).toBe(false);
  });
});
