import { salesSignals } from "@/lib/sales-pitch";

// お問い合わせのうち営業らしいものを見分ける。印を付けるだけで捨てないが、ふつうの
// お問い合わせに印が付くと、お店が見落とす（別のラベルへ振り分けられる）。

describe("salesSignals", () => {
  it("日本のフォーム営業の文面を見分ける", () => {
    const pitch =
      "ご担当者様\n突然のご連絡失礼いたします。弊社はホームページ制作と集客の支援をしております。御社のサイトを拝見し、ご連絡いたしました。";
    // 「御社」「ご担当者様」は丁寧なお客さまも書くので見ない（2026-10-15 のコードレビュー）
    expect(salesSignals("株式会社サンプル 山田", pitch)).toEqual(["弊社", "集客", "ホームページ制作"]);
  });

  it("英語の SEO・制作の売り込みを見分ける", () => {
    const pitch =
      "Hi, I noticed your website is not on the first page of Google. Our agency offers SEO and backlinks to increase your traffic.";
    // 「Our agency」は旅行会社なども書くので見ない（2026-10-15 のコードレビュー）
    expect(salesSignals("Mark", pitch)).toEqual(["SEO", "backlinks", "Google ranking", "traffic"]);
    expect(salesSignals("", "We offer affordable seo services for small shops.")).toEqual(["SEO"]);
  });

  it("全角や大文字小文字が違っても見分ける", () => {
    expect(salesSignals("", "ＳＥＯ対策のご案内です")).toEqual(["SEO"]);
    expect(salesSignals("", "web制作の会社です")).toEqual(["Web制作"]);
    // 「website design」だけでは褒め言葉にも当たるので、services などと組のときだけ
    expect(salesSignals("", "We offer WEBSITE DESIGN SERVICES for shops")).toEqual(["web design"]);
  });

  it("ふつうのお問い合わせには印を付けない", () => {
    const messages = [
      "Do you ship to Melbourne? I would love Tokiwa as a gift for my sister.",
      "I'm visiting Seoul and then Tokyo next spring — could I see the bags at the temple?",
      "営業時間を教えてください。お寺で実物を見られますか。",
      "突然のご連絡失礼いたします。母への贈り物に、緑のボトルバッグを探しています。",
      "I run a small homeware shop in Hobart and would love to talk about stocking your bags.",
      "Could you make one in navy? My traffic-light red one is perfect but I need something quieter.",
      "Our agency is organising a small tour group to Fuji in April. Could we visit the temple and buy bags?",
      "I work in digital marketing in Sydney and fell in love with Ai. Do you ship to Perth?",
      "I love your website design and the bags! Do you ship to Perth?",
      "I'm a web designer in Melbourne. Is Ai still available?",
      "Do you outsource any of the sewing, or is it all made at the temple?",
      "I heard there is more traffic near Fuji on weekends. Is Saturday a good day to visit?",
      // 丁寧に書く日本のお客さまは「ご担当者様」「貴社」「御社」も使う
      "ご担当者様\n緑のボトルバッグを購入したいのですが、在庫はありますか。",
      "貴社のバッグを母に贈りたいです。名入れはできますか。",
      "御社の作品をインスタで拝見しました。実物をお寺で見られますか。",
    ];
    for (const message of messages) expect(salesSignals("Customer", message)).toEqual([]);
  });

  it("韓国の姓の Seo を SEO と取り違えない（名前を大文字で書く人も）", () => {
    expect(salesSignals("Minji Seo", "Do you ship to Busan?")).toEqual([]);
    expect(salesSignals("Seo-yeon Park", "Is Hanada still available?")).toEqual([]);
    expect(salesSignals("SEO Jiwoo", "Do you ship to Busan?")).toEqual([]);
    expect(salesSignals("MINJI SEO", "Is Hanada still available?")).toEqual([]);
    expect(salesSignals("Ada", "My name is Seo Minji and I would like Beni.")).toEqual([]);
  });

  it("空白が長く続く本文でも、すぐに終わる（Workers の CPU 10ms に収まる）", () => {
    const worst = [
      `increase${" ".repeat(4990)}x`,
      `website${" ".repeat(4990)}x`,
      `first${" page".repeat(1200)}`,
      `seo${" ".repeat(4990)}x`,
    ];
    const started = performance.now();
    for (let i = 0; i < 10; i++) for (const text of worst) salesSignals("Ada", text);
    expect(performance.now() - started).toBeLessThan(50);
  });
});
