/**
 * @jest-environment node
 */

import robots from "@/app/robots";
import { SITE_ORIGIN } from "@/lib/site-url";

it("robots.txt は公開ページを塞がず、API だけを止め、サイトマップは https", () => {
  const file = robots();
  const rules = Array.isArray(file.rules) ? file.rules : [file.rules];
  expect(rules).toEqual([{ userAgent: "*", allow: "/", disallow: ["/api/"] }]);
  expect(file.sitemap).toBe(`${SITE_ORIGIN}/sitemap.xml`);
  expect(String(file.sitemap)).toMatch(/^https:\/\//);
  const disallowed = rules.flatMap((rule) => (Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow]));
  for (const path of ["/", "/collection", "/blog", "/studio"]) {
    expect(disallowed).not.toContain(path);
  }
});
