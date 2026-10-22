import "server-only";

import type { BlogPost } from "@/data/blog";
import { leadSrc, productPath, type Product, type ProductStatus } from "@/data/products";
import { legal, site } from "@/data/site";
import { pieceKind, pieceProductName } from "@/lib/piece-text";
import { siteUrl } from "@/lib/site-url";
import { SHIPPING_COUNTRIES, shippingFor } from "@/data/shipping";

/* ------------------------------------------------------------------
   検索エンジン向けの構造化データ（JSON-LD）と、共有したときの表示（OG）の基本形。
   組むだけ —— 出すのは components/seo/JsonLd.tsx。

   ページに見えていることだけを書く（値段・状態・送料・返品の決まり）。見えていないことを
   書くと、構造化データの違反として扱われる。
   ------------------------------------------------------------------ */

type Json = Record<string, unknown>;

/**
 * OG の基本形。Next の metadata は openGraph を**丸ごと差し替える**（浅いマージ）ので、
 * ページで openGraph を書くときは必ずこれを広げる —— 書かないと siteName や locale が落ちる。
 */
export const OPEN_GRAPH_BASE = { type: "website", siteName: site.name, locale: "en_US" } as const;

/** 写真の無いページを共有したときの絵。 */
export const OPEN_GRAPH_IMAGE = "/images/scenes/altar-standing.webp";

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

const organizationRef = { "@type": "Organization", name: site.name, url: siteUrl("/") };

const postalAddress = { "@type": "PostalAddress", ...legal.addressParts };

/** 作品の写真（絶対 URL）。folder から組む（slug から引き直さない）。サイトマップも使う。 */
export function productImages(p: Pick<Product, "folder" | "galleryCount">): string[] {
  return Array.from({ length: p.galleryCount }, (_, i) => siteUrl(leadSrc(p.folder, i + 1)));
}

/**
 * 作品のページ。**値段が未定なら出さない**（null）—— Google の商品の構造化データは
 * offers が無いと無効として扱われる。
 */
export function productJsonLd(p: Product): Json | null {
  if (p.priceAud == null) return null;
  const url = siteUrl(productPath(p));
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    // 名前だけ（"Ai 藍"）だと、検索や Google ショッピングで何の品か分からない
    name: pieceProductName(p),
    description: `${p.note} ${p.story}`,
    image: productImages(p),
    sku: p.sku,
    url,
    brand: { "@type": "Brand", name: site.name },
    category: pieceKind(p),
    material: p.materials.join(", "),
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
        // 送料の正本は data/shipping.ts（特商法・一覧・決済と同じ A$40）
        shippingRate: { "@type": "MonetaryAmount", value: shippingFor([p]), currency: "AUD" },
        // 届くまでの日数はオーナーの「およそ一週間」（準備 1–2 日 + 輸送 3–5 日、合計最大 7 日）。
        // この日数を言われたのはオーストラリア向けなので、発送先は AU だけにする。
        // ほかの国（SHIPPING_COUNTRIES）は同じ送料だが、輸送日数を書いていない。
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "AU" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 3, maxValue: 5, unitCode: "DAY" },
        },
      },
      // 特商法の返品の決まり: 一点物なので返品は受けない（破損・違う品は別に対応）
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: [...SHIPPING_COUNTRIES],
        returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
      },
    },
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
      item: siteUrl(item.path),
    })),
  };
}

/** Blog の記事。 */
export function blogPostingJsonLd(post: BlogPost): Json {
  const url = siteUrl(`/blog/${post.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    ...(post.dek ? { description: post.dek } : {}),
    ...(post.date ? { datePublished: post.date } : {}),
    ...(post.updated ? { dateModified: post.updated } : {}),
    ...(post.image ? { image: [post.image.startsWith("http") ? post.image : siteUrl(post.image)] } : {}),
    inLanguage: "en",
    url,
    mainEntityOfPage: url,
    author: organizationRef,
    publisher: organizationRef,
  };
}

/**
 * トップ。店とサイトそのもの。
 *
 * 地図と位置（hasMap・geo）は場所（Place）にしか付けられないので、作っている場所＝本妙寺を
 * Place として立て、店の location で結ぶ。住所は特商法の表記と同じもの（data/site.ts）。
 * **電話番号は載せない** —— 特商法のページには出しているが、検索結果の店舗情報として
 * 広まるのは避ける（作り手の携帯）。
 */
export function storeJsonLd(): Json[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      name: site.name,
      url: siteUrl("/"),
      description: site.description,
      email: site.email,
      address: postalAddress,
      location: {
        "@type": "Place",
        name: "Honmyoji Temple",
        address: postalAddress,
        geo: { "@type": "GeoCoordinates", latitude: site.geo.latitude, longitude: site.geo.longitude },
        hasMap: site.maps,
      },
      // 同じ店のアカウント。検索エンジンがサイトと Instagram を同じ店として結びつける
      sameAs: [site.instagram],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site.name,
      url: siteUrl("/"),
      inLanguage: "en",
    },
  ];
}
