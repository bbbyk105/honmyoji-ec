import { products, toCartPiece } from "@/data/products";
import { addPiece, canonicalSlug, parseCart, removePiece, resolvePieces, samePiece } from "@/lib/cart";

const catalog = products.map(toCartPiece);

describe("parseCart", () => {
  it("空・壊れた JSON・配列以外は空のカート", () => {
    expect(parseCart(null)).toEqual([]);
    expect(parseCart("")).toEqual([]);
    expect(parseCart("{not json")).toEqual([]);
    expect(parseCart('{"a":1}')).toEqual([]);
  });

  it("文字列以外は落とす", () => {
    expect(parseCart('["sakura-cherry", 3, null, "ai"]')).toEqual(["sakura-cherry", "ai"]);
  });
});

describe("旧 folder 名の扱い", () => {
  it("canonicalSlug は folder 名を slug に揃える", () => {
    expect(canonicalSlug(catalog, "sakura")).toBe("sakura-cherry");
    expect(canonicalSlug(catalog, "sakura-cherry")).toBe("sakura-cherry");
  });

  it("カタログに無い鍵はそのまま返す", () => {
    expect(canonicalSlug(catalog, "gone")).toBe("gone");
  });

  it("samePiece は slug と folder 名を同じ一点とみなす", () => {
    expect(samePiece(catalog, "sakura", "sakura-cherry")).toBe(true);
    expect(samePiece(catalog, "sakura", "ai")).toBe(false);
    expect(samePiece(catalog, "gone", "gone")).toBe(true);
    expect(samePiece(catalog, "gone", "also-gone")).toBe(false);
  });
});

describe("addPiece / removePiece", () => {
  it("足すときは slug で書く", () => {
    expect(addPiece([], catalog, "ai")).toEqual(["ai-indigo"]);
  });

  it("もう入っていれば null（旧 folder 名で入っていても）", () => {
    expect(addPiece(["sakura"], catalog, "sakura-cherry")).toBeNull();
    expect(addPiece(["sakura-cherry"], catalog, "sakura-cherry")).toBeNull();
  });

  it("外すときは旧 folder 名の行も一緒に外す", () => {
    expect(removePiece(["sakura", "ai-indigo"], catalog, "sakura-cherry")).toEqual(["ai-indigo"]);
  });

  it("元の配列は書き換えない", () => {
    const current = ["ai-indigo"];
    addPiece(current, catalog, "matsu-pine");
    removePiece(current, catalog, "ai-indigo");
    expect(current).toEqual(["ai-indigo"]);
  });
});

describe("resolvePieces", () => {
  it("並び順を保ち、カタログから消えた slug は落とす", () => {
    const pieces = resolvePieces(catalog, ["matsu", "gone", "sakura-cherry"]);
    expect(pieces.map((p) => p.slug)).toEqual(["matsu-pine", "sakura-cherry"]);
  });
});
