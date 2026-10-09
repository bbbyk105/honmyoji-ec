/**
 * @jest-environment node
 */

// next/jest は .env を読み込むので、SUPABASE_* を消してから読み込む（本番の DB を叩かない）。

export {};

jest.mock("server-only", () => ({}));

import { products } from "@/data/products";

type Catalog = typeof import("@/lib/catalog");

function load(): Catalog {
  const saved = { ...process.env };
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  let mod!: Catalog;
  jest.isolateModules(() => {
    mod = jest.requireActual<Catalog>("@/lib/catalog");
  });
  process.env = saved;
  return mod;
}

beforeEach(() => {
  jest.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("getPieces", () => {
  const [first, second] = products;

  it("同じ作品は一つにする（決済の slugs はお客さまが書き換えられる）", async () => {
    const pieces = await load().getPieces([first.slug, first.slug]);
    expect(pieces.map((p) => p.slug)).toEqual([first.slug]);
  });

  it("slug と旧 folder 名で同じ作品を指しても一つ", async () => {
    const pieces = await load().getPieces([first.slug, first.folder, second.slug]);
    expect(pieces.map((p) => p.slug)).toEqual([first.slug, second.slug]);
  });

  it("見つからないものは落とし、並びは渡した順", async () => {
    const pieces = await load().getPieces([second.slug, "no-such-piece", first.folder]);
    expect(pieces.map((p) => p.slug)).toEqual([second.slug, first.slug]);
  });
});

describe("getListedCatalog", () => {
  it("試し買い用（test）は一覧に出さない", async () => {
    const listed = await load().getListedCatalog();
    expect(listed.every((p) => !p.test)).toBe(true);
    expect(listed).toHaveLength(products.filter((p) => !p.test).length);
  });
});
