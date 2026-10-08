import "server-only";

import { createClient, type MicroCMSImage, type MicroCMSListContent } from "microcms-js-sdk";
import { site } from "@/data/site";
import {
  byNewest,
  blogSeed,
  type BlogPost,
  type BlogImageRatio,
  type BlogImageRole,
} from "@/data/blog";

/* ------------------------------------------------------------------
   microCMS — Blog（ブログ）の記事はここから来る。
   **サーバ専用**。API キーは NEXT_PUBLIC_ を付けない — このモジュールを
   "use client" から import しないこと。

   環境変数（.env.example 参照）が無いときは data/blog.ts の seed に
   落ちる。鍵の無い環境でもビルドと表示が通るようにするため — 「CMS が
   未設定だからサイトが 500」は EC では一番やってはいけない壊れ方。
   API が落ちたときは、ビルド中だけ seed に落ち、動いている間は投げる
   （作り直しを失敗させて前の正しいページを残す。getBlogPosts の註）。
   ------------------------------------------------------------------ */

const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = process.env.MICROCMS_API_KEY;

/** microCMS の API（エンドポイント）名。管理画面で別名にしたときだけ env で上書き。 */
export const BLOG_ENDPOINT = process.env.MICROCMS_BLOG_ENDPOINT ?? "blogs";

/** Webhook から revalidate するときのタグ。`app/api/revalidate/route.ts` が叩く。 */
export const BLOG_TAG = "blog";

/** 定期再検証（秒）。Webhook が通れば実質こちらは保険。 */
const REVALIDATE_SECONDS = 600;

/** 一覧で引く上限。記事がこれを超えたらページングを入れる。 */
const LIST_LIMIT = 100;

type Client = ReturnType<typeof createClient>;
let cached: Client | null = null;

export function microcmsClient(): Client | null {
  if (!serviceDomain || !apiKey) return null;
  cached ??= createClient({ serviceDomain, apiKey, retry: true });
  return cached;
}

export const microcmsEnabled = Boolean(serviceDomain && apiKey);

/**
 * microCMS 側のスキーマ（docs/microcms.md と合わせること）。
 * select フィールドは string[] で返る。
 */
export type BlogContent = {
  title?: string;
  titleJa?: string;
  dek?: string;
  date?: string;
  season?: string;
  topic?: string | string[];
  image?: MicroCMSImage;
  imageAlt?: string;
  imageRole?: string | string[];
  imageRatio?: string | string[];
  pull?: string;
  content?: string;
};

const ROLES: BlogImageRole[] = ["blog", "material-macro", "lifestyle", "process"];
const RATIOS: BlogImageRatio[] = ["4/5", "16/10", "3/4", "1/1"];

function one(value: string | string[] | undefined): string {
  const v = Array.isArray(value) ? value[0] : value;
  return (v ?? "").trim();
}

function pick<T extends string>(value: string | string[] | undefined, allowed: T[], fallback: T): T {
  const v = one(value);
  return (allowed as string[]).includes(v) ? (v as T) : fallback;
}

/**
 * タイトル末尾の「 | MIROKU」を落とす。
 *
 * SEO ツールが出す `<title>` をそのまま title 欄に貼る運用になっているので、ブランド名が
 * 接尾辞で入ってくる。これを素通しすると二箇所で壊れる —— H1 に「| MIROKU」が出て見出しに
 * 見えなくなり、`app/layout.tsx` の template が `— MIROKU` を足すので `<title>` では
 * ブランドが二度出る（実際に「… | MIROKU — MIROKU」になっていた）。
 * 落とすのは末尾の区切り＋ブランド名だけ。本文中の MIROKU や、タイトル途中の `|` は触らない。
 */
const BRAND_SUFFIX = new RegExp(
  `\\s*[|｜–—-]\\s*${site.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`,
  "i",
);

function cleanTitle(raw: string): string {
  return raw.replace(BRAND_SUFFIX, "").trim() || raw;
}

/**
 * microCMS の画像を microCMS 自身の画像 API で縮めた URL にする（幅 1600・WebP）。
 * Cloudflare の画像変換を通さない（next.config.ts の註）。記事の見出しの写真は最大でも
 * 版面の 980px なので、1600 あれば高精細の画面でも足りる。
 */
export function blogImage(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    u.searchParams.set("w", "1600");
    u.searchParams.set("fm", "webp");
    u.searchParams.set("q", "80");
    return u.toString();
  } catch {
    return undefined;
  }
}

/** 本文の HTML は描く前に無害化する（lib/blog-html.ts）。読み込みは記事を取るときだけ。 */
async function sanitizer(): Promise<(html: string) => string> {
  return (await import("@/lib/blog-html")).sanitizeBlogHtml;
}

function toPost(content: BlogContent & MicroCMSListContent, sanitize: (html: string) => string): BlogPost {
  const title = cleanTitle(content.title?.trim() || "Untitled");
  const raw = content.content?.trim();
  const html = raw ? sanitize(raw) : "";

  return {
    slug: content.id,
    title,
    titleJa: content.titleJa?.trim() ?? "",
    dek: content.dek?.trim() ?? "",
    date: content.date || content.publishedAt || content.createdAt,
    season: content.season?.trim() ?? "",
    topic: one(content.topic) || "Note",
    image: blogImage(content.image?.url),
    imageAlt: content.imageAlt?.trim() || title,
    imageRole: pick(content.imageRole, ROLES, "blog"),
    imageRatio: pick(content.imageRatio, RATIOS, "16/10"),
    pull: content.pull?.trim() || undefined,
    body: html ? [{ type: "html", html }] : [],
  };
}

const seed = [...blogSeed].sort(byNewest);

/**
 * 記事一覧（新しい順）。詳細ページもここから引く — 一覧を一度だけ取って
 * キャッシュを共有したほうが、記事ごとに叩くより速く、次の記事への導線も作れる。
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  const client = microcmsClient();
  if (!client) return seed;

  try {
    const res = await client.getList<BlogContent>({
      endpoint: BLOG_ENDPOINT,
      queries: { limit: LIST_LIMIT, richEditorFormat: "html" },
      customRequestInit: { next: { revalidate: REVALIDATE_SECONDS, tags: [BLOG_TAG] } },
    });
    const sanitize = await sanitizer();
    const entries = res.contents.map((c) => toPost(c, sanitize)).sort(byNewest);
    return entries.length > 0 ? entries : seed;
  } catch (error) {
    // ビルドの途中だけ予備の記事に落とす（microCMS の不調でデプロイを止めない）。
    // 動いている間は投げる —— 予備の記事を返すと、それが正しいページとして 10 分キャッシュ
    // され、本物の記事が消える（監査 17）。投げれば作り直しが失敗し、前の正しいページが残る。
    // 記事を読むのは作り置きのページだけ（一覧・記事・トップ・作品）なので、500 にはならない。
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.error(`[microcms] failed to load "${BLOG_ENDPOINT}" during build — using seed posts`, error);
      return seed;
    }
    throw error;
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | undefined> {
  const entries = await getBlogPosts();
  return entries.find((e) => e.slug === slug);
}

/** 記事の次の一本（末尾なら先頭へ戻る）。記事が一本しか無いときは undefined。 */
export function nextPost(posts: BlogPost[], slug: string): BlogPost | undefined {
  if (posts.length < 2) return undefined;
  const i = posts.findIndex((p) => p.slug === slug);
  if (i < 0) return posts[0];
  return posts[(i + 1) % posts.length];
}

/**
 * 本文中から特定の記事へ送る導線（ヒーローの「On the material」、商品ページの
 * 「Care note」など）の href。**slug を焼き込まない** — 記事は microCMS 側で
 * 入れ替わるので、指定の slug → 同じ topic の記事 → 最新 → 一覧、の順に落とす。
 */
export async function blogHref(preferredSlug: string, topic: string): Promise<string> {
  const posts = await getBlogPosts();
  const hit =
    posts.find((p) => p.slug === preferredSlug) ??
    posts.find((p) => p.topic.toLowerCase() === topic.toLowerCase()) ??
    posts[0];
  return hit ? `/blog/${hit.slug}` : "/blog";
}

/**
 * 下書きプレビュー。microCMS の「画面プレビュー」から
 * /blog/preview?slug={CONTENT_ID}&draftKey={DRAFT_KEY} で来る。
 * 下書きはキャッシュしない。
 */
/**
 * コンテンツ ID と draftKey の形。microCMS の SDK は contentId を URL に**そのまま**つなぐので、
 * `../` や `?` を混ぜると別の API を叩かせられる（監査 15）。英数字と - _ だけ通す。
 */
const DRAFT_PARAM = /^[A-Za-z0-9_-]{1,100}$/;

export function isDraftParam(value: string): boolean {
  return DRAFT_PARAM.test(value);
}

export async function getBlogDraft(slug: string, draftKey: string): Promise<BlogPost | undefined> {
  const client = microcmsClient();
  if (!client) return undefined;
  if (!isDraftParam(slug) || !isDraftParam(draftKey)) return undefined;

  try {
    const content = await client.getListDetail<BlogContent>({
      endpoint: BLOG_ENDPOINT,
      contentId: slug,
      queries: { draftKey, richEditorFormat: "html" },
      customRequestInit: { cache: "no-store" },
    });
    return toPost(content, await sanitizer());
  } catch (error) {
    console.error(`[microcms] draft preview failed for "${slug}"`, error);
    return undefined;
  }
}
