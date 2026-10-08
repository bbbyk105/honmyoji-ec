import { EMAIL_MAX_LENGTH, isEmail } from "@/lib/email";
import { twoDigits } from "@/lib/format";
import { headingId } from "@/lib/heading-id";

describe("twoDigits", () => {
  it("一桁は 0 で埋める", () => {
    expect(twoDigits(1)).toBe("01");
    expect(twoDigits(9)).toBe("09");
  });

  it("二桁以上はそのまま", () => {
    expect(twoDigits(10)).toBe("10");
    expect(twoDigits(123)).toBe("123");
  });
});

describe("headingId", () => {
  it("英語の見出しは小文字のハイフン区切り", () => {
    expect(headingId("How the Bag Began", new Set())).toBe("how-the-bag-began");
  });

  it("日本語は文字のまま残す", () => {
    expect(headingId("畳の縁とは？", new Set())).toBe("畳の縁とは");
  });

  it("同じ見出しが続いたら連番を足す", () => {
    const taken = new Set<string>();
    expect(headingId("Care", taken)).toBe("care");
    expect(headingId("Care", taken)).toBe("care-2");
    expect(headingId("Care", taken)).toBe("care-3");
  });

  it("記号だけの見出しは section", () => {
    expect(headingId("— · —", new Set())).toBe("section");
  });

  it("長い見出しは 60 字で切る", () => {
    expect(headingId("a".repeat(100), new Set())).toHaveLength(60);
  });
});

describe("isEmail", () => {
  it("普通のアドレスは通す", () => {
    expect(isEmail("hello@honmyoujifuji.com")).toBe(true);
    expect(isEmail("a.b+c@mail.example.co.jp")).toBe(true);
  });

  it("形の崩れたものは通さない", () => {
    expect(isEmail("hello")).toBe(false);
    expect(isEmail("hello@example")).toBe(false);
    expect(isEmail("he llo@example.com")).toBe(false);
  });

  it("254 文字を超えたら正規表現に渡す前に断る（. を並べた長い文字列で計算量が 2 乗になる）", () => {
    const longest = `${"a".repeat(64)}@${"b".repeat(185)}.com`;
    expect(longest).toHaveLength(EMAIL_MAX_LENGTH);
    expect(isEmail(longest)).toBe(true);
    expect(isEmail(`a${longest}`)).toBe(false);

    const started = performance.now();
    expect(isEmail(`a@${".".repeat(200_000)}@`)).toBe(false);
    expect(performance.now() - started).toBeLessThan(50);
  });
});
