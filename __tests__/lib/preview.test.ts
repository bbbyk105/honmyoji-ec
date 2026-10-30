/**
 * @jest-environment node
 */

export {};

import { PREVIEW_SECRET_ENV, previewSecretOk, safeInternalPath } from "@/lib/preview";

describe("safeInternalPath", () => {
  it("内部パスはそのまま通す", () => {
    expect(safeInternalPath("/blog/the-edge")).toBe("/blog/the-edge");
    expect(safeInternalPath("/blog/a-b_c")).toBe("/blog/a-b_c");
    expect(safeInternalPath("/blog/post?x=1#top")).toBe("/blog/post?x=1#top");
  });

  it("外部 URL・プロトコル相対・スキームは fallback に落とす", () => {
    expect(safeInternalPath("https://evil.com")).toBe("/blog");
    expect(safeInternalPath("http://evil.com/blog")).toBe("/blog");
    expect(safeInternalPath("//evil.com")).toBe("/blog");
    expect(safeInternalPath("javascript:alert(1)")).toBe("/blog");
    expect(safeInternalPath("blog/x")).toBe("/blog"); // "/" で始まらない
  });

  it("バックスラッシュ・制御文字・空白の細工は fallback に落とす", () => {
    // ブラウザは "\" を "/" として扱うので "/\evil.com" はプロトコル相対と同じ
    expect(safeInternalPath("/\\evil.com")).toBe("/blog");
    expect(safeInternalPath("/blog/\tx")).toBe("/blog");
    expect(safeInternalPath("/blog/a b")).toBe("/blog");
    expect(safeInternalPath("  //evil.com")).toBe("/blog"); // trim してもプロトコル相対
  });

  it("空・未指定は fallback（既定 /blog、明示もできる）", () => {
    expect(safeInternalPath(null)).toBe("/blog");
    expect(safeInternalPath(undefined)).toBe("/blog");
    expect(safeInternalPath("")).toBe("/blog");
    expect(safeInternalPath("https://evil.com", "/blog/intro")).toBe("/blog/intro");
  });
});

describe("previewSecretOk", () => {
  const original = process.env[PREVIEW_SECRET_ENV];
  afterAll(() => {
    if (original === undefined) delete process.env[PREVIEW_SECRET_ENV];
    else process.env[PREVIEW_SECRET_ENV] = original;
  });

  it("秘密鍵が未設定なら、何を渡しても拒否する", () => {
    delete process.env[PREVIEW_SECRET_ENV];
    expect(previewSecretOk("anything")).toBe(false);
    expect(previewSecretOk("")).toBe(false);
    expect(previewSecretOk(null)).toBe(false);
  });

  it("一致したときだけ通す", () => {
    process.env[PREVIEW_SECRET_ENV] = "s3cr3t-token";
    expect(previewSecretOk("s3cr3t-token")).toBe(true);
    expect(previewSecretOk("s3cr3t-toke")).toBe(false); // 長さ違い
    expect(previewSecretOk("s3cr3t-tokeN")).toBe(false); // 一文字違い
    expect(previewSecretOk(null)).toBe(false);
    expect(previewSecretOk(undefined)).toBe(false);
  });
});
