import { imageSize } from "@/data/image-sizes";
import {
  LINE_RATIO,
  findByKey,
  getProduct,
  isPurchasable,
  leadSrc,
  priceLabel,
  productImage,
  productPath,
  products,
  toCartPiece,
} from "@/data/products";

describe("findByKey", () => {
  it("slug でも folder 名でも同じ一点を引く", () => {
    expect(findByKey(products, "tokiwa-evergreen")?.sku).toBe("MI-BAG-001");
    expect(findByKey(products, "bottle-01")?.sku).toBe("MI-BAG-001");
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

  it("slug・folder・SKU は重ならない", () => {
    for (const key of ["slug", "folder", "sku"] as const) {
      const values = products.map((p) => p[key]);
      expect(new Set(values).size).toBe(values.length);
    }
  });
});

describe("画像", () => {
  it("leadSrc(folder) は productImage(slug, n) と全点で一致する", () => {
    for (const p of products) {
      expect(leadSrc(p.folder)).toBe(productImage(p.slug, 1));
      expect(leadSrc(p.folder, 2)).toBe(productImage(p.slug, 2));
    }
  });

  /*
    galleryCount と実際の写真、主役の比率と LINE_RATIO がずれると、一覧のタイルで
    object-cover が二度切ったり、商品ページで 404 の井戸が出たりする。
    寸法表は scripts/prepare-photos.py が書く。
  */
  it("写真は galleryCount 枚ぶん揃っていて、主役は区分の比率で切ってある", () => {
    for (const p of products) {
      for (let n = 1; n <= p.galleryCount; n++) {
        expect(imageSize(productImage(p.slug, n))).toBeDefined();
      }
      expect(imageSize(productImage(p.slug, p.galleryCount + 1))).toBeUndefined();

      const lead = imageSize(productImage(p.slug, 1))!;
      const [w, h] = LINE_RATIO[p.line].split("/").map(Number);
      expect(lead.width / lead.height).toBeCloseTo(w / h, 2);
    }
  });

  it("productPath は slug だけで組める", () => {
    expect(productPath({ slug: "ai-indigo" })).toBe("/collection/ai-indigo");
  });
});

describe("client に渡す形", () => {
  const piece = products[0];

  it("toCartPiece はカートが読む項目だけを持つ", () => {
    expect(Object.keys(toCartPiece(piece)).sort()).toEqual(
      ["folder", "kanji", "name", "priceAud", "slug", "status"].sort(),
    );
  });

  it("物語・素材・寸法は client に渡らない（全ページの HTML に焼き込まれるため）", () => {
    const json = JSON.stringify(toCartPiece(piece));
    expect(json).not.toContain(piece.story);
    expect(json).not.toContain(piece.storyJa);
    expect(toCartPiece(piece)).not.toHaveProperty("materials");
    expect(toCartPiece(piece)).not.toHaveProperty("size");
  });
});

describe("価格", () => {
  it("買えるのは available で、価格が入っているものだけ", () => {
    expect(isPurchasable({ status: "available", priceAud: 190 })).toBe(true);
    expect(isPurchasable({ status: "available", priceAud: null })).toBe(false);
    expect(isPurchasable({ status: "made_to_order", priceAud: 330 })).toBe(false);
    expect(isPurchasable({ status: "reserved", priceAud: 190 })).toBe(false);
    expect(isPurchasable({ status: "sold_out", priceAud: 190 })).toBe(false);
    expect(isPurchasable({ status: "coming_soon", priceAud: null })).toBe(false);
  });

  it("値札は A$、未定なら null", () => {
    expect(priceLabel({ priceAud: 220 })).toBe("A$220");
    expect(priceLabel({ priceAud: null })).toBeNull();
  });

  it("価格の無い作品を Available のまま置かない（買えない売り物になる）", () => {
    for (const p of products) {
      if (p.priceAud == null) expect(p.status).not.toBe("available");
    }
  });
});
