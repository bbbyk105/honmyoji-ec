import { STATUS_LABEL, type Product, type ProductStatus } from "@/data/products";
import type { ShippingAddress } from "@/lib/orders";

/* ------------------------------------------------------------------
   注文のときにお店へ送るメールの文面。**組むだけで送らない**（送るのは Webhook が
   `lib/mail.ts` で）。DB にも Stripe にも触らない純粋な関数なので、テストで直に叩く。
   ------------------------------------------------------------------ */

export type Mail = { subject: string; text: string };

type PieceLine = Pick<Product, "name" | "kanji"> & { price: string | null };

export type OrderMailInput = {
  /** MI-0001 */
  ref: string;
  /** A$183（送料込みの合計） */
  amount: string;
  customerName: string | null;
  customerEmail: string | null;
  shipping: ShippingAddress | null;
  pieces: PieceLine[];
  /** 管理画面の注文ページ（絶対 URL） */
  studioUrl: string;
};

/** 送り先を、宛名ラベルに書き写せる順に。空の行は落とす。 */
export function addressLines(a: ShippingAddress | null): string[] {
  if (!a) return [];
  return [
    a.name,
    a.line1,
    a.line2,
    [a.city, a.state, a.postal_code].filter(Boolean).join(" "),
    a.country,
    a.phone ? `電話: ${a.phone}` : undefined,
  ].filter((line): line is string => Boolean(line && line.trim()));
}

/** 注文が入った。お店が発送の支度を始められるだけのことを一通に。 */
export function orderPlacedMail(o: OrderMailInput): Mail {
  const address = addressLines(o.shipping);
  return {
    subject: `【MIROKU】注文が入りました — ${o.ref}（${o.amount}）`,
    text: [
      "注文が入りました。発送の支度をお願いします。",
      "作品は自動で「完売」にしてあります。",
      "",
      `注文番号: ${o.ref}`,
      `合計: ${o.amount}（送料込み）`,
      "",
      "作品:",
      ...o.pieces.map((p) => `  ${p.name} ${p.kanji}${p.price ? ` — ${p.price}` : ""}`),
      "",
      `お客さま: ${o.customerName ?? "—"}${o.customerEmail ? ` <${o.customerEmail}>` : ""}`,
      "",
      "送り先:",
      ...(address.length ? address.map((line) => `  ${line}`) : ["  （住所が届いていません。Stripe で確認してください）"]),
      "",
      `管理画面: ${o.studioUrl}`,
      "発送したら、管理画面で「発送済み」にして追跡番号を控えてください。",
    ].join("\n"),
  };
}

type Clash = Pick<Product, "name" | "kanji"> & { status: ProductStatus };

/**
 * 決済が通る前に、もう買えない状態になっていた作品。
 *
 * 決済画面を開いたあとで別の人が先に払った（完売）、展示会で売れて手で完売にした、
 * 取り置きにした —— どれも、同じ一点を二人に売った可能性がある。
 */
export function clashesBefore(before: Clash[]): Clash[] {
  return before.filter((p) => p.status === "sold_out" || p.status === "reserved");
}

/** 二重に売れたかもしれない。どちらに渡すかはお店が決めるので、事実と手順だけを書く。 */
export function doubleSaleMail(o: {
  ref: string;
  clashes: Clash[];
  studioUrl: string;
  stripeUrl: string | null;
}): Mail {
  return {
    subject: `【MIROKU 要確認】同じ作品が二度売れた可能性があります — ${o.ref}`,
    text: [
      `注文 ${o.ref} の作品のうち、次のものは決済が通る前に、もう買えない状態になっていました。`,
      "同じ一点を二人のお客さまに売ってしまった可能性があります。",
      "",
      ...o.clashes.map((p) => `  ${p.name} ${p.kanji} — 決済の前は「${STATUS_LABEL[p.status].ja}」`),
      "",
      "どちらのお客さまにお渡しするかを決めて、もう一方には Stripe のダッシュボードから返金し、",
      "お詫びのメールを送ってください。",
      "",
      `この注文: ${o.studioUrl}`,
      ...(o.stripeUrl ? [`Stripe: ${o.stripeUrl}`] : []),
    ].join("\n"),
  };
}
