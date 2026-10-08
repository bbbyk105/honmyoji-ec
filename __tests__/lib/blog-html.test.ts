/**
 * @jest-environment node
 */

import { sanitizeBlogHtml } from "@/lib/blog-html";

describe("sanitizeBlogHtml", () => {
  it("script は中身ごと捨てる", () => {
    expect(sanitizeBlogHtml('<p>a</p><script>alert(1)</script><p>b</p>')).toBe("<p>a</p><p>b</p>");
  });

  it("on* 属性と javascript: の URL を落とす", () => {
    const out = sanitizeBlogHtml('<img src="x" onerror="alert(1)"><a href="javascript:alert(1)">x</a>');
    expect(out).not.toMatch(/onerror|javascript:/i);
  });

  it("iframe・style・class は残さない（CMS 側で色や大きさを付けない）", () => {
    const out = sanitizeBlogHtml('<iframe src="https://evil.example"></iframe><p class="red" style="color:red">t</p>');
    expect(out).toBe("<p>t</p>");
  });

  it("リッチエディタが出すものは残す（見出しの id は目次が使う）", () => {
    const html =
      '<h2 id="h1">Care</h2><p><strong>Hold</strong> the <em>weave</em>.</p>' +
      '<ul><li>one</li></ul><a href="https://honmyoujifuji.com/collection" target="_blank" rel="noopener">see</a>' +
      '<figure><img src="https://images.microcms-assets.io/assets/x/y/a.jpg" alt="bag"><figcaption>bag</figcaption></figure>';
    expect(sanitizeBlogHtml(html)).toBe(html);
  });
});
