/**
 * @jest-environment node
 */

import { intercept, limitBody } from "@/worker/guard";

const req = (path: string, init?: RequestInit) => new Request(`https://honmyoujifuji.com${path}`, init);

describe("転送", () => {
  it("www は本体へ 301（パスとクエリはそのまま）", () => {
    const res = intercept(new Request("https://www.honmyoujifuji.com/collection?x=1"));
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe("https://honmyoujifuji.com/collection?x=1");
  });

  const http = { "cf-visitor": '{"scheme":"http"}' };

  it("http で来たら https へ。POST は 308（本文ごと送り直してもらう）", () => {
    expect(intercept(new Request("http://honmyoujifuji.com/faq", { headers: http }))?.headers.get("location")).toBe(
      "https://honmyoujifuji.com/faq",
    );
    const post = new Request("http://honmyoujifuji.com/contact", { method: "POST", body: "x", headers: http });
    expect(intercept(post)?.status).toBe(308);
  });

  it("https で来たら送らない", () => {
    const https = { "cf-visitor": '{"scheme":"https"}' };
    expect(intercept(new Request("https://honmyoujifuji.com/faq", { headers: https }))).toBeNull();
  });

  it("手元（wrangler dev は本番のホスト名を http で渡すが cf-visitor が無い）は送らない", () => {
    expect(intercept(new Request("http://honmyoujifuji.com/faq"))).toBeNull();
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

describe("本文の長さ", () => {
  it("Content-Length が数でなければ 400", () => {
    const res = intercept(req("/contact", { method: "POST", headers: { "content-length": "abc" } }));
    expect(res?.status).toBe(400);
  });

  it("Content-Length の無い本文は、読みながら数えて上限で止める", async () => {
    const big = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(600 * 1024));
        controller.enqueue(new Uint8Array(600 * 1024));
        controller.close();
      },
    });
    const limited = limitBody(
      new Request("https://honmyoujifuji.com/contact", { method: "POST", body: big, duplex: "half" } as RequestInit),
    );
    await expect(limited.arrayBuffer()).rejects.toThrow();
  });

  it("上限より小さい本文と、Content-Length のある要求はそのまま", async () => {
    const small = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(1024));
        controller.close();
      },
    });
    const limited = limitBody(
      new Request("https://honmyoujifuji.com/contact", { method: "POST", body: small, duplex: "half" } as RequestInit),
    );
    expect((await limited.arrayBuffer()).byteLength).toBe(1024);

    const withLength = req("/contact", { method: "POST", body: "x", headers: { "content-length": "1" } });
    expect(limitBody(withLength)).toBe(withLength);
  });
});
