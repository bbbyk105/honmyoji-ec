import {
  cutoutSrc,
  findByKey,
  getProduct,
  isPurchasable,
  productCutout,
  productPath,
  products,
  toCartPiece,
  toShelfPiece,
} from "@/data/products";

describe("findByKey", () => {
  it("slug でも旧 folder 名でも同じ一点を引く", () => {
    expect(findByKey(products, "sakura-cherry")?.sku).toBe("MI-BAG-001");
    expect(findByKey(products, "sakura")?.sku).toBe("MI-BAG-001");
  });

  it("無い鍵は undefined", () => {
    expect(findByKey(products, "no-such-piece")).toBeUndefined();
  });

  it("getProduct は findByKey と同じ約束", () => {
    for (const p of products) {
      expect(getProduct(p.slug)).toBe(p);
      expect(getProduct(p.folder)).toBe(p);
    }
  });
});

describe("画像のパス", () => {
  it("cutoutSrc(folder) は productCutout(slug) と全点で一致する", () => {
    for (const p of products) {
      expect(cutoutSrc(p.folder)).toBe(productCutout(p.slug));
    }
  });

  it("productPath は slug だけで組める", () => {
    expect(productPath({ slug: "ai-indigo" })).toBe("/collection/ai-indigo");
  });
});

describe("client に渡す形", () => {
  const sakura = products[0];

  it("toCartPiece はカートが読む項目だけを持つ", () => {
    expect(Object.keys(toCartPiece(sakura)).sort()).toEqual(
      ["folder", "kanji", "name", "priceAud", "slug", "status"].sort(),
    );
  });

  it("toShelfPiece は展示台が読む項目だけを持つ", () => {
    expect(Object.keys(toShelfPiece(sakura)).sort()).toEqual(
      ["cutoutAspect", "folder", "kanji", "line", "name", "note", "priceAud", "slug", "status"].sort(),
    );
  });

  it("物語・素材・寸法は client に渡らない（全ページの HTML に焼き込まれるため）", () => {
    for (const piece of [toCartPiece(sakura), toShelfPiece(sakura)]) {
      const json = JSON.stringify(piece);
      expect(json).not.toContain(sakura.story);
      expect(json).not.toContain(sakura.storyJa);
      expect(piece).not.toHaveProperty("materials");
      expect(piece).not.toHaveProperty("size");
    }
  });
});

describe("isPurchasable", () => {
  it("買えるのは available だけ", () => {
    expect(isPurchasable({ status: "available" })).toBe(true);
    expect(isPurchasable({ status: "made_to_order" })).toBe(false);
    expect(isPurchasable({ status: "reserved" })).toBe(false);
    expect(isPurchasable({ status: "sold_out" })).toBe(false);
    expect(isPurchasable({ status: "coming_soon" })).toBe(false);
  });
});
