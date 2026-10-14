/**
 * @jest-environment node
 */

// 作品の URL は変えない（2026-10-15〜）。販売中で検索にも載るので、旧 URL からの転送は恒久にする。
// もう無い旧作品だけは、戻ってくる可能性があるので一時のまま（next.config.ts の註）。

import nextConfig from "@/next.config";
import { products } from "@/data/products";

type Redirect = { source: string; destination: string; permanent: boolean };

async function redirects(): Promise<Redirect[]> {
  return (await nextConfig.redirects!()) as Redirect[];
}

it("書き出し番号（folder）の URL から作品の URL へは恒久に転送する", async () => {
  const list = await redirects();
  for (const p of products.filter((x) => x.folder !== x.slug && !x.test)) {
    expect(list).toContainEqual({ source: `/collection/${p.folder}`, destination: `/collection/${p.slug}`, permanent: true });
  }
  expect(list).toContainEqual({ source: "/collection/ai", destination: "/collection/ai-indigo", permanent: true });
});

it("もう無い旧作品の URL は一覧へ一時の転送のまま（戻ってくる可能性がある）", async () => {
  const old = (await redirects()).find((r) => r.source.includes(":old("));
  expect(old).toMatchObject({ destination: "/collection", permanent: false });
});

it("試し買い用の作品（test）の転送は一時のまま（slug はそのたびに変わり、folder は使い回す）", async () => {
  const list = await redirects();
  const testPiece = { slug: "test-purchase", folder: "test-01", test: true };
  // 試し買い用は今のカタログに無いので、next.config.ts が組む規則そのものを確かめる
  const { productRedirects } = await import("@/data/products");
  expect(productRedirects([testPiece as never])).toEqual([
    { source: "/collection/test-01", destination: "/collection/test-purchase", permanent: false },
  ]);
  expect(list.filter((r) => r.source.includes("test-"))).toEqual([]);
});

it("転送元が今ある作品の URL と重ならない（重なると作品のページに入れなくなる）", async () => {
  const live = new Set(products.map((p) => `/collection/${p.slug}`));
  for (const r of await redirects()) expect(live.has(r.source)).toBe(false);
});

it("名前を変えた作品の旧 slug（previousSlugs）は恒久に今の slug へ転送する", async () => {
  const { productRedirects } = await import("@/data/products");
  const renamed = { slug: "ai-indigo", folder: "bottle-07", previousSlugs: ["ai-old"] };
  expect(productRedirects([renamed as never])).toContainEqual({
    source: "/collection/ai-old",
    destination: "/collection/ai-indigo",
    permanent: true,
  });
});
