/**
 * @jest-environment node
 */

jest.mock("server-only", () => ({}));

import { products } from "@/data/products";
import { getPieces } from "@/lib/catalog";

describe("getPieces", () => {
  const [first, second] = products;

  it("同じ作品は一つにする（決済の slugs はお客さまが書き換えられる）", async () => {
    const pieces = await getPieces([first.slug, first.slug]);
    expect(pieces.map((p) => p.slug)).toEqual([first.slug]);
  });

  it("slug と旧 folder 名で同じ作品を指しても一つ", async () => {
    const pieces = await getPieces([first.slug, first.folder, second.slug]);
    expect(pieces.map((p) => p.slug)).toEqual([first.slug, second.slug]);
  });

  it("見つからないものは落とし、並びは渡した順", async () => {
    const pieces = await getPieces([second.slug, "no-such-piece", first.folder]);
    expect(pieces.map((p) => p.slug)).toEqual([second.slug, first.slug]);
  });
});
