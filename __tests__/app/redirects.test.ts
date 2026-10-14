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
  for (const p of products.filter((x) => x.folder !== x.slug)) {
    expect(list).toContainEqual({ source: `/collection/${p.folder}`, destination: `/collection/${p.slug}`, permanent: true });
  }
  expect(list).toContainEqual({ source: "/collection/ai", destination: "/collection/ai-indigo", permanent: true });
});

it("もう無い旧作品の URL は一覧へ一時の転送のまま（戻ってくる可能性がある）", async () => {
  const old = (await redirects()).find((r) => r.source.includes(":old("));
  expect(old).toMatchObject({ destination: "/collection", permanent: false });
});
