import { isLang, langFromAcceptLanguage } from "@/lib/lang";

describe("langFromAcceptLanguage", () => {
  it("一番目が日本語なら日本語", () => {
    expect(langFromAcceptLanguage("ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7")).toBe("ja");
    expect(langFromAcceptLanguage("ja")).toBe("ja");
  });

  it("一番目が日本語以外なら、二番目以降に日本語があっても英語", () => {
    expect(langFromAcceptLanguage("en-AU,en;q=0.9,ja;q=0.8")).toBe("en");
    expect(langFromAcceptLanguage("zh-TW,zh;q=0.9")).toBe("en");
  });

  it("書かれた順ではなく重みで決める", () => {
    expect(langFromAcceptLanguage("en;q=0.5,ja;q=0.9")).toBe("ja");
  });

  it("無い・空・q=0 だけのときは英語", () => {
    expect(langFromAcceptLanguage(null)).toBe("en");
    expect(langFromAcceptLanguage("")).toBe("en");
    expect(langFromAcceptLanguage("ja;q=0")).toBe("en");
    expect(langFromAcceptLanguage("*")).toBe("en");
  });

  it("jam のような別の言語を日本語と取り違えない", () => {
    expect(langFromAcceptLanguage("jam")).toBe("en");
  });
});

describe("isLang", () => {
  it("ja と en だけ", () => {
    expect(isLang("ja")).toBe(true);
    expect(isLang("en")).toBe(true);
    expect(isLang("fr")).toBe(false);
    expect(isLang(undefined)).toBe(false);
  });
});
