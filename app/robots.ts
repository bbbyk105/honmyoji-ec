import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

/* /robots.txt。止めるのは API だけ —— 管理画面（/studio）や thank-you は noindex で外してあり、
   ここで塞ぐと検索エンジンがその noindex を読めなくなる。Cloudflare がこの前に
   コンテンツの使い方の表明（Content Signals）を足して出す。 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
