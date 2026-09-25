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
