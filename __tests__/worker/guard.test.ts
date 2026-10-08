/**
 * @jest-environment node
 */

import { intercept } from "@/worker/guard";

const req = (path: string, init?: RequestInit) => new Request(`https://honmyoujifuji.com${path}`, init);

describe("転送", () => {
  it("www は本体へ 301（パスとクエリはそのまま）", () => {
    const res = intercept(new Request("https://www.honmyoujifuji.com/collection?x=1"));
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe("https://honmyoujifuji.com/collection?x=1");
  });

  it("http は https へ。POST は 308（本文ごと送り直してもらう）", () => {
    expect(intercept(new Request("http://honmyoujifuji.com/faq"))?.headers.get("location")).toBe(
      "https://honmyoujifuji.com/faq",
    );
    expect(intercept(new Request("http://honmyoujifuji.com/contact", { method: "POST", body: "x" }))?.status).toBe(308);
  });

  it("手元（127.0.0.1 の http）は送らない", () => {
    expect(intercept(new Request("http://127.0.0.1:8787/"))).toBeNull();
  });
});

describe("拒否", () => {
  it("/cdn-cgi/ は OpenNext に渡さず 404（開発用の画像変換の道を閉じる）", () => {
    expect(intercept(req("/cdn-cgi/image/width=100/https://example.com/a.png"))?.status).toBe(404);
  });

  it("Content-Length が 1MB を超える本文は読む前に 413", () => {
    const big = req("/contact", { method: "POST", headers: { "content-length": String(1024 * 1024 + 1) } });
    expect(intercept(big)?.status).toBe(413);
  });

  it("ふつうのページと小さな POST は通す", () => {
    expect(intercept(req("/collection"))).toBeNull();
    expect(intercept(req("/contact", { method: "POST", headers: { "content-length": "512" } }))).toBeNull();
    expect(intercept(req("/images/cdn-cgi-like.webp"))).toBeNull();
  });
});
