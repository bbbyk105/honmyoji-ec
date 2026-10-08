/**
 * @jest-environment node
 */

import { refuse } from "@/worker/guard";

const req = (path: string, init?: RequestInit) => new Request(`https://honmyoujifuji.com${path}`, init);

describe("refuse", () => {
  it("/cdn-cgi/ は OpenNext に渡さず 404（開発用の画像変換の道を閉じる）", () => {
    expect(refuse(req("/cdn-cgi/image/width=100/https://example.com/a.png"))?.status).toBe(404);
  });

  it("Content-Length が 1MB を超える本文は読む前に 413", () => {
    const big = req("/contact", { method: "POST", headers: { "content-length": String(1024 * 1024 + 1) } });
    expect(refuse(big)?.status).toBe(413);
  });

  it("ふつうのページと小さな POST は通す", () => {
    expect(refuse(req("/collection"))).toBeNull();
    expect(refuse(req("/contact", { method: "POST", headers: { "content-length": "512" } }))).toBeNull();
    expect(refuse(req("/images/cdn-cgi-like.webp"))).toBeNull();
  });
});
