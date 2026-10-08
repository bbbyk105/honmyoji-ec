/**
 * @jest-environment node
 */

export {};

jest.mock("server-only", () => ({}));

import { renderToStaticMarkup } from "react-dom/server";

import { JsonLd } from "@/components/seo/JsonLd";
import { products } from "@/data/products";
import { blogPostingJsonLd, breadcrumbJsonLd, productJsonLd, storeJsonLd } from "@/lib/seo";

const piece = products[0];

describe("productJsonLd", () => {
  it("値段・在庫・送料 A$40・返品不可を、見えているとおりに書く", () => {
    const ld = productJsonLd({ ...piece, status: "available", priceAud: 145 }) as {
      offers: Record<string, unknown> & { shippingDetails: { shippingRate: { value: number } } };
      url: string;
      image: string[];
    };
    expect(ld.url).toBe(`https://honmyoujifuji.com/collection/${piece.slug}`);
    expect(ld.image[0]).toBe(`https://honmyoujifuji.com/images/products/${piece.folder}/1.webp`);
    expect(ld.offers).toMatchObject({ priceCurrency: "AUD", price: 145, availability: "https://schema.org/InStock" });
    expect(ld.offers.shippingDetails.shippingRate.value).toBe(40);
    expect(JSON.stringify(ld.offers)).toContain("MerchantReturnNotPermitted");
  });

  it("完売は SoldOut、Coming soon は在庫なし（値段が出ていても買えない）", () => {
    const sold = productJsonLd({ ...piece, status: "sold_out" }) as { offers: { availability: string } };
    const soon = productJsonLd({ ...piece, status: "coming_soon" }) as { offers: { availability: string } };
    expect(sold.offers.availability).toBe("https://schema.org/SoldOut");
    expect(soon.offers.availability).toBe("https://schema.org/OutOfStock");
  });

  it("値段が未定なら offers を出さない", () => {
    expect(productJsonLd({ ...piece, priceAud: null })).not.toHaveProperty("offers");
  });
});

describe("そのほか", () => {
  it("パンくずは 1 から順に絶対 URL で", () => {
    const ld = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
    ]) as { itemListElement: { position: number; item: string }[] };
    expect(ld.itemListElement.map((i) => [i.position, i.item])).toEqual([
      [1, "https://honmyoujifuji.com/"],
      [2, "https://honmyoujifuji.com/blog"],
    ]);
  });

  it("記事の写真が相対パスなら絶対 URL にする", () => {
    const ld = blogPostingJsonLd({
      slug: "welcome",
      title: "Welcome",
      titleJa: "",
      dek: "Open",
      date: "2026-10-01",
      season: "",
      topic: "Note",
      image: "/images/stock/a.webp",
      imageAlt: "",
      imageRole: "blog",
      imageRatio: "16/10",
      body: [],
    }) as { image: string[]; url: string };
    expect(ld.image).toEqual(["https://honmyoujifuji.com/images/stock/a.webp"]);
    expect(ld.url).toBe("https://honmyoujifuji.com/blog/welcome");
  });

  it("店の情報に電話番号は載せない", () => {
    expect(JSON.stringify(storeJsonLd())).not.toContain("telephone");
  });

  it("JsonLd は < を逃がす（文字列から </script> で抜けられない）", () => {
    const html = renderToStaticMarkup(<JsonLd data={{ name: "</script><script>alert(1)</script>" }} />);
    expect(html).not.toContain("</script><script>");
    expect(html).toContain("\\u003c/script>");
  });
});
