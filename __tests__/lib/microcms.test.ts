/**
 * @jest-environment node
 */

export {};

jest.mock("server-only", () => ({}));

import { blogImage, isDraftParam } from "@/lib/microcms";

describe("isDraftParam", () => {
  it("英数字と - _ だけ通す（SDK は contentId を URL にそのままつなぐ）", () => {
    expect(isDraftParam("tatami-beri_01")).toBe(true);
    expect(isDraftParam("../blogs?limit=100")).toBe(false);
    expect(isDraftParam("a/b")).toBe(false);
    expect(isDraftParam("")).toBe(false);
    expect(isDraftParam("x".repeat(101))).toBe(false);
  });
});

describe("blogImage", () => {
  it("microCMS の画像 API で幅 1600・WebP にする", () => {
    expect(blogImage("https://images.microcms-assets.io/assets/abc/def/a.jpg")).toBe(
      "https://images.microcms-assets.io/assets/abc/def/a.jpg?w=1600&fm=webp&q=80",
    );
  });

  it("無い・読めないときは undefined", () => {
    expect(blogImage(undefined)).toBeUndefined();
    expect(blogImage("not a url")).toBeUndefined();
  });
});
