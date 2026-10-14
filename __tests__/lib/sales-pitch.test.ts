import { salesSignals } from "@/lib/sales-pitch";

// お問い合わせのうち営業らしいものを見分ける。印を付けるだけで捨てないが、ふつうの
// お問い合わせに印が付くと、お店が見落とす（別のラベルへ振り分けられる）。

describe("salesSignals", () => {
  it("日本のフォーム営業の文面を見分ける", () => {
    const pitch =
      "ご担当者様\n突然のご連絡失礼いたします。弊社はホームページ制作と集客の支援をしております。御社のサイトを拝見し、ご連絡いたしました。";
    expect(salesSignals("株式会社サンプル 山田", pitch)).toEqual(["弊社", "御社", "ご担当者様", "集客", "ホームページ制作"]);
  });

  it("英語の SEO・制作の売り込みを見分ける", () => {
    const pitch =
      "Hi, I noticed your website is not on the first page of Google. Our agency offers SEO and backlinks to increase your traffic.";
    expect(salesSignals("Mark", pitch)).toEqual(["SEO", "backlinks", "Google ranking", "traffic", "marketing agency"]);
  });

  it("全角や大文字小文字が違っても見分ける", () => {
    expect(salesSignals("", "ＳＥＯ対策のご案内です")).toEqual(["SEO"]);
    expect(salesSignals("", "web制作の会社です")).toEqual(["Web制作"]);
    expect(salesSignals("", "We do WEBSITE DESIGN for shops")).toEqual(["web design"]);
  });

  it("ふつうのお問い合わせには印を付けない", () => {
    const messages = [
      "Do you ship to Melbourne? I would love Tokiwa as a gift for my sister.",
      "I'm visiting Seoul and then Tokyo next spring — could I see the bags at the temple?",
      "営業時間を教えてください。お寺で実物を見られますか。",
      "突然のご連絡失礼いたします。母への贈り物に、緑のボトルバッグを探しています。",
      "I run a small homeware shop in Hobart and would love to talk about stocking your bags.",
      "Could you make one in navy? My traffic-light red one is perfect but I need something quieter.",
    ];
    for (const message of messages) expect(salesSignals("Customer", message)).toEqual([]);
  });
});
