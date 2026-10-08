import { addressLines, doubleSaleMail, orderConfirmationMail, orderPlacedMail } from "@/lib/order-mail";

const base = {
  ref: "MI-0007",
  amount: "A$183",
  customerName: "Jane Doe",
  customerEmail: "jane@example.com",
  shipping: {
    name: "Jane Doe",
    line1: "1 George St",
    city: "Sydney",
    state: "NSW",
    postal_code: "2000",
    country: "AU",
    phone: "+61 400 000 000",
  },
  pieces: [{ name: "Hishi", kanji: "菱", price: "A$148" }],
  studioUrl: "https://example.com/studio/orders/7",
};

describe("orderPlacedMail", () => {
  it("件名に注文番号と合計が入る", () => {
    expect(orderPlacedMail(base).subject).toBe("【MIROKU】注文が入りました — MI-0007（A$183）");
  });

  it("作品・お客さま・送り先・管理画面の URL が本文に入る", () => {
    const { text } = orderPlacedMail(base);
    expect(text).toContain("  Hishi 菱 — A$148");
    expect(text).toContain("お客さま: Jane Doe <jane@example.com>");
    expect(text).toContain("  Sydney NSW 2000");
    expect(text).toContain("  電話: +61 400 000 000");
    expect(text).toContain("管理画面: https://example.com/studio/orders/7");
  });

  it("お客さまの言語を書く（返信をどちらで書くかの目安）", () => {
    expect(orderPlacedMail({ ...base, customerLang: "ja" }).text).toContain("お客さまの言語: 日本語");
    expect(orderPlacedMail({ ...base, customerLang: "en" }).text).toContain("お客さまの言語: 英語");
    expect(orderPlacedMail(base).text).not.toContain("お客さまの言語");
  });

  it("住所が無ければ、無いと書く（空欄で黙らない）", () => {
    expect(orderPlacedMail({ ...base, shipping: null }).text).toContain("住所が届いていません");
  });
});

describe("addressLines", () => {
  it("空の行を落とす", () => {
    expect(addressLines({ name: "A", line1: "1 St", line2: "", country: "JP" })).toEqual(["A", "1 St", "JP"]);
  });
});

describe("doubleSaleMail", () => {
  it("決済の前の状態と、返金の入口を書く", () => {
    const { subject, text } = doubleSaleMail({
      ref: "MI-0008",
      clashes: [{ name: "Hishi", kanji: "菱", status: "sold_out" }],
      studioUrl: "https://example.com/studio/orders/8",
      stripeUrl: "https://dashboard.stripe.com/payments/pi_1",
    });
    expect(subject).toContain("MI-0008");
    expect(text).toContain("Hishi 菱 — 決済の前は「完売」");
    expect(text).toContain("Stripe: https://dashboard.stripe.com/payments/pi_1");
  });

  it("payment intent が無ければ Stripe の行を出さない", () => {
    const { text } = doubleSaleMail({
      ref: "MI-0009",
      clashes: [{ name: "Kago", kanji: "籠", status: "reserved" }],
      studioUrl: "/studio/orders/9",
      stripeUrl: null,
    });
    expect(text).not.toContain("Stripe:");
    expect(text).toContain("「取り置き中」");
  });
});

describe("orderConfirmationMail", () => {
  it("件名と書き出しはお客さまの名前と注文番号（英語）", () => {
    const mail = orderConfirmationMail(base);
    expect(mail.subject).toBe("Thank you — your MIROKU order MI-0007");
    expect(mail.text.split("\n")[0]).toBe("Thank you, Jane Doe.");
  });

  it("作品・合計・送り先が入り、電話番号は載せない", () => {
    const { text } = orderConfirmationMail(base);
    expect(text).toContain("Order MI-0007");
    expect(text).toContain("  Hishi 菱 — A$148");
    expect(text).toContain("Total: A$183 (shipping included)");
    expect(text).toContain("  Sydney NSW 2000");
    expect(text).not.toContain("+61 400 000 000");
    expect(text).not.toContain("電話");
  });

  it("日本語のお客さまには日本語で（様付け・住所あり・電話なし）", () => {
    const mail = orderConfirmationMail({ ...base, customerName: "近藤 白虎", lang: "ja" });
    expect(mail.subject).toBe("【MIROKU】ご注文ありがとうございます（MI-0007）");
    expect(mail.text.split("\n")[0]).toBe("近藤 白虎 様");
    expect(mail.text).toContain("ご注文番号: MI-0007");
    expect(mail.text).toContain("合計: A$183（送料込み）");
    expect(mail.text).toContain("お届け先:");
    expect(mail.text).toContain("静岡県富士市 本妙寺");
    expect(mail.text).not.toContain("+61 400 000 000");
    expect(mail.text).not.toContain("Thank you");
  });

  it("言語が無ければ英語", () => {
    expect(orderConfirmationMail(base).subject).toBe("Thank you — your MIROKU order MI-0007");
  });

  it("名前も住所も無くても崩れない", () => {
    const { text } = orderConfirmationMail({ ...base, customerName: null, shipping: null });
    expect(text.split("\n")[0]).toBe("Thank you.");
    expect(text).not.toContain("Shipping to:");
  });
});
