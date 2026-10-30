/**
 * Blog の下書きプレビューが「対象のコンテンツ ID の記事」でだけ下書きを描くことを確かめる。
 *
 * draftKey は一本の記事にしか効かないので、Draft Mode の cookie が site-wide でも、
 *   - 対象の slug … 下書きを取り、"Preview"（noindex）のメタになる
 *   - それ以外の slug … getBlogDraft を呼ばず、公開版と通常のメタに落ちる
 *   - 対象でも下書きが取れないとき … 公開版に落ちる（無ければ notFound）
 */

import { renderToStaticMarkup } from "react-dom/server";

// --- 可変なモックの状態（各テストで差し替える） -------------------------
let draftEnabled = false;
let cookieStore: Record<string, string> = {};

jest.mock("next/headers", () => ({
  draftMode: async () => ({ isEnabled: draftEnabled }),
  cookies: async () => ({
    get: (name: string) =>
      Object.prototype.hasOwnProperty.call(cookieStore, name) ? { value: cookieStore[name] } : undefined,
  }),
}));

const notFound = jest.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
jest.mock("next/navigation", () => ({ notFound: () => notFound() }));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

const mockGetBlogPosts = jest.fn<Promise<unknown>, unknown[]>();
const mockGetBlogPost = jest.fn<Promise<unknown>, unknown[]>();
const mockGetBlogDraft = jest.fn<Promise<unknown>, unknown[]>();
const mockNextPost = jest.fn<unknown, unknown[]>(() => undefined);
jest.mock("@/lib/microcms", () => ({
  // ラッパ越しに呼ぶ（factory の巻き上げで mock 変数より上に来るため、直接参照は TDZ）。
  getBlogPosts: (...a: unknown[]) => mockGetBlogPosts(...a),
  getBlogPost: (...a: unknown[]) => mockGetBlogPost(...a),
  getBlogDraft: (...a: unknown[]) => mockGetBlogDraft(...a),
  nextPost: (...a: unknown[]) => mockNextPost(...a),
  isDraftParam: (v: string) => /^[A-Za-z0-9_-]{1,100}$/.test(v),
}));

jest.mock("@/lib/catalog", () => ({ getListedCatalog: async () => [] }));
jest.mock("@/components/collection/PieceIndex", () => ({ toPieceRefs: () => [] }));
jest.mock("@/components/seo/JsonLd", () => ({ JsonLd: () => null }));
jest.mock("@/lib/seo", () => ({
  blogPostingJsonLd: () => ({}),
  breadcrumbJsonLd: () => ({}),
  OPEN_GRAPH_BASE: {},
  OPEN_GRAPH_IMAGE: "/og.png",
}));
jest.mock("@/components/blog/BlogArticle", () => ({
  BlogArticle: ({ entry }: { entry: { slug: string } }) => <div data-slug={entry.slug} />,
}));

import { PREVIEW_CONTENT_COOKIE, PREVIEW_DRAFT_COOKIE } from "@/lib/preview";
import BlogArticlePage, { generateMetadata } from "@/app/(site)/blog/[slug]/page";

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

beforeEach(() => {
  jest.clearAllMocks();
  draftEnabled = false;
  cookieStore = {};
  mockNextPost.mockReturnValue(undefined);
});

describe("Blog draft preview（対象の記事だけ）", () => {
  it("cookie の対象と一致する slug は下書きを描き、Preview（noindex）になる", async () => {
    draftEnabled = true;
    cookieStore = { [PREVIEW_CONTENT_COOKIE]: "the-edge", [PREVIEW_DRAFT_COOKIE]: "dk123" };
    mockGetBlogDraft.mockResolvedValue({ slug: "the-edge", title: "下書き" });

    const meta = await generateMetadata(params("the-edge"));
    expect(meta.title).toBe("Preview");
    expect(meta.robots).toEqual({ index: false, follow: false });

    const html = renderToStaticMarkup(await BlogArticlePage(params("the-edge")));
    expect(mockGetBlogDraft).toHaveBeenCalledWith("the-edge", "dk123");
    expect(html).toContain('data-slug="the-edge"');
    expect(html).toContain("Draft preview");
  });

  it("対象でない slug は下書きを取りに行かず、公開版・通常のメタになる", async () => {
    draftEnabled = true;
    cookieStore = { [PREVIEW_CONTENT_COOKIE]: "the-edge", [PREVIEW_DRAFT_COOKIE]: "dk123" };
    mockGetBlogPost.mockResolvedValue({ slug: "other", title: "別の記事", dek: "d", image: null, date: null });
    mockGetBlogPosts.mockResolvedValue([{ slug: "other", title: "別の記事" }]);

    const meta = await generateMetadata(params("other"));
    expect(meta.title).toBe("別の記事");
    expect(meta.robots).toBeUndefined();
    expect(mockGetBlogDraft).not.toHaveBeenCalled();

    const html = renderToStaticMarkup(await BlogArticlePage(params("other")));
    expect(mockGetBlogDraft).not.toHaveBeenCalled();
    expect(html).toContain('data-slug="other"');
    expect(html).not.toContain("Draft preview");
  });

  it("対象でも下書きが取れないときは公開版に落ちる", async () => {
    draftEnabled = true;
    cookieStore = { [PREVIEW_CONTENT_COOKIE]: "the-edge", [PREVIEW_DRAFT_COOKIE]: "dk123" };
    mockGetBlogDraft.mockResolvedValue(undefined);
    mockGetBlogPosts.mockResolvedValue([{ slug: "the-edge", title: "公開版" }]);

    const html = renderToStaticMarkup(await BlogArticlePage(params("the-edge")));
    expect(mockGetBlogDraft).toHaveBeenCalledWith("the-edge", "dk123");
    expect(html).toContain('data-slug="the-edge"');
    expect(html).not.toContain("Draft preview");
  });

  it("対象でも下書きが取れないときは公開版の通常メタになる（Preview/noindex にしない）", async () => {
    draftEnabled = true;
    cookieStore = { [PREVIEW_CONTENT_COOKIE]: "the-edge", [PREVIEW_DRAFT_COOKIE]: "dk123" };
    mockGetBlogDraft.mockResolvedValue(undefined);
    mockGetBlogPost.mockResolvedValue({ slug: "the-edge", title: "公開版", dek: "d", image: null, date: null });

    const meta = await generateMetadata(params("the-edge"));
    expect(mockGetBlogDraft).toHaveBeenCalledWith("the-edge", "dk123");
    expect(meta.title).toBe("公開版");
    expect(meta.robots).toBeUndefined();
  });

  it("対象でも下書きも公開版も無ければ notFound()", async () => {
    draftEnabled = true;
    cookieStore = { [PREVIEW_CONTENT_COOKIE]: "the-edge", [PREVIEW_DRAFT_COOKIE]: "dk123" };
    mockGetBlogDraft.mockResolvedValue(undefined);
    mockGetBlogPosts.mockResolvedValue([]);

    await expect(BlogArticlePage(params("the-edge"))).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
