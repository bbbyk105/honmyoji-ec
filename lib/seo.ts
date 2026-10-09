import "server-only";

import type { BlogPost } from "@/data/blog";
import { LINE_LABEL, productImage, productPath, type Product, type ProductStatus } from "@/data/products";
import { site } from "@/data/site";
import { SHIPPING_AUD, SHIPPING_COUNTRIES } from "@/lib/stripe-config";

/* ------------------------------------------------------------------
   検索エンジン向けの構造化データ（JSON-LD）。組むだけ —— 出すのは components/seo/JsonLd.tsx。

   ページに見えていることだけを書く（値段・状態・送料・返品の決まり）。見えていないことを
   書くと、構造化データの違反として扱われる。
   ------------------------------------------------------------------ */

type Json = Record<string, unknown>;

/** 本番の絶対 URL。 */
export function absoluteUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || site.url).replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * 作品の状態 → schema.org の在庫。Coming soon は値段が出ていても買えないので「在庫なし」。
 * 完売の作品もページは残す（一点物で、同じ雰囲気の注文につながる）—— 在庫は SoldOut。
 */
const AVAILABILITY: Record<ProductStatus, string> = {
  available: "https://schema.org/InStock",
  made_to_order: "https://schema.org/MadeToOrder",
  reserved: "https://schema.org/Reserved",
  sold_out: "https://schema.org/SoldOut",
  coming_soon: "https://schema.org/OutOfStock",
};

const organizationRef = { "@type": "Organization", name: site.name, url: absoluteUrl("/") };

/** 作品のページ。値段が未定なら offers を出さない（Product だけ）。 */
export function productJsonLd(p: Product): Json {
  const url = absoluteUrl(productPath(p));
  const images = Array.from({ length: p.galleryCount }, (_, i) => absoluteUrl(productImage(p.slug, i + 1)));
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${p.name} ${p.kanji}`,
    description: `${p.note} ${p.story}`,
    image: images,
    sku: p.sku,
    url,
    brand: { "@type": "Brand", name: site.name },
    category: LINE_LABEL[p.line].en,
    material: p.materials.join(", "),
    ...(p.priceAud != null
      ? {
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: "AUD",
            price: p.priceAud,
            availability: AVAILABILITY[p.status],
            itemCondition: "https://schema.org/NewCondition",
            seller: organizationRef,
            shippingDetails: {
              "@type": "OfferShippingDetails",
              shippingRate: { "@type": "MonetaryAmount", value: SHIPPING_AUD, currency: "AUD" },
              shippingDestination: SHIPPING_COUNTRIES.map((country) => ({
                "@type": "DefinedRegion",
                addressCountry: country,
              })),
            },
            // 特商法の返品の決まり: 一点物なので返品は受けない（破損・違う品は別に対応）
            hasMerchantReturnPolicy: {
              "@type": "MerchantReturnPolicy",
              applicableCountry: [...SHIPPING_COUNTRIES],
              returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
            },
          },
        }
      : {}),
  };
}

/** パンくず（画面には出さず、検索結果の表示にだけ使う）。 */
export function breadcrumbJsonLd(items: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Blog の記事。 */
export function blogPostingJsonLd(post: BlogPost): Json {
  const url = absoluteUrl(`/blog/${post.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    ...(post.dek ? { description: post.dek } : {}),
    ...(post.date ? { datePublished: post.date } : {}),
    ...(post.image ? { image: [post.image.startsWith("http") ? post.image : absoluteUrl(post.image)] } : {}),
    inLanguage: "en",
    url,
    mainEntityOfPage: url,
    author: organizationRef,
    publisher: organizationRef,
  };
}

/** トップ。店とサイトそのもの。 */
export function storeJsonLd(): Json[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      name: site.name,
      url: absoluteUrl("/"),
      description: site.description,
      email: site.email,
      // 住所は特商法の表記（data/site.ts の legal.address）と同じ。電話番号は載せない ——
      // 特商法のページには出しているが、検索結果の店舗情報として広まるのは避ける（作り手の携帯）
      address: {
        "@type": "PostalAddress",
        streetAddress: "1254-2 Nakazato",
        addressLocality: "Fuji",
        addressRegion: "Shizuoka",
        addressCountry: "JP",
      },
      geo: { "@type": "GeoCoordinates", latitude: site.geo.latitude, longitude: site.geo.longitude },
      hasMap: site.maps,
      // 同じ店のアカウント。検索エンジンがサイトと Instagram を同じ店として結びつける
      sameAs: [site.instagram],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site.name,
      url: absoluteUrl("/"),
      inLanguage: "en",
    },
  ];
}
