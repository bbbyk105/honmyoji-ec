"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { isPurchasable } from "@/data/products";
import { getPieces, toCents } from "@/lib/catalog";
import { isLang, langFromAcceptLanguage, type Lang } from "@/lib/lang";
import { SHIPPING_AUD, SHIPPING_COUNTRIES } from "@/lib/stripe-config";

/* ------------------------------------------------------------------
   カート → Stripe Checkout。

   商品は Stripe 側に登録しない。一点物で、価格も文言も data/products.ts と
   管理画面が正本なので、二重に持つと必ずどちらかが古くなる。毎回 price_data
   でその場に組む。
   ------------------------------------------------------------------ */

export type CheckoutState = { error?: string };

/** 決済画面が開いていられる時間（分）。定数は "use server" から export しない。 */
const CHECKOUT_HOLD_MINUTES = 35;

/** カートに出す失敗の文言。言語はカートの表示と同じ（フォームの lang）。 */
const ERRORS = {
  notReady: {
    en: "Checkout is not ready yet. Please write to us from the contact page.",
    ja: "決済の準備がまだできていません。お問い合わせからご連絡ください。",
  },
  empty: { en: "Your cart is empty.", ja: "カートが空です。" },
  notFound: { en: "We could not find the pieces in your cart.", ja: "カートの品が見つかりませんでした。" },
  noPage: { en: "We could not open the checkout page.", ja: "決済ページを開けませんでした。" },
  failed: {
    en: "We could not open the checkout page. Please try again in a moment.",
    ja: "決済ページを開けませんでした。少し待ってからもう一度お試しください。",
  },
} satisfies Record<string, Record<Lang, string>>;

function unavailableError(names: string, lang: Lang): string {
  return lang === "ja"
    ? `${names} は今お求めいただけません。カートから外してからお進みください。`
    : `${names} can no longer be bought. Please remove it from your cart to continue.`;
}

async function origin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

export async function startCheckout(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  // お客さまの言語。カートが表示に使った言語（フォームの lang）を優先し、無ければブラウザの
  // Accept-Language。決済画面・確認メール・thank-you をこれで揃える（lib/lang.ts）
  const sent = formData.get("lang");
  const lang: Lang = isLang(sent) ? sent : langFromAcceptLanguage((await headers()).get("accept-language"));

  // SDK は読むだけで重いので、決済を作るときにだけ読む（MiniCart がこの action を
  // 全ページで参照しているので、上で import すると全ページが SDK を背負う）
  const { stripe } = await import("@/lib/stripe");
  const client = stripe();
  if (!client) {
    return { error: ERRORS.notReady[lang] };
  }

  const slugs = String(formData.get("slugs") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (slugs.length === 0) return { error: ERRORS.empty[lang] };

  const pieces = await getPieces(slugs);
  if (pieces.length === 0) return { error: ERRORS.notFound[lang] };

  // 一点物なので、決済に進む直前にもう一度状態を見る。カートに入れたあとで
  // 別の人が買った、という取り違えがいちばん起きやすい。
  // 値段の無いものも通さない（管理画面で Available にだけして価格を入れ忘れた、を止める）。
  const unavailable = pieces.filter((p) => !isPurchasable(p));
  if (unavailable.length > 0) {
    return { error: unavailableError(unavailable.map((p) => p.name).join(", "), lang) };
  }

  const base = await origin();
  // 試し買い用（data/products.ts の test）だけの決済には送料を付けない
  const shipping = pieces.every((p) => p.test) ? 0 : SHIPPING_AUD;

  try {
    const session = await client.checkout.sessions.create({
      mode: "payment",
      currency: "aud",
      // 日本語の人には日本語で。それ以外は Stripe の自動判定（中国語・韓国語・フランス語なども
      // Stripe が持っている言語ならその言語で出る）。メールと thank-you は lang のまま英語
      locale: lang === "ja" ? "ja" : "auto",
      line_items: pieces.map((piece) => ({
        quantity: 1,
        price_data: {
          currency: "aud",
          unit_amount: toCents(piece.priceAud ?? 0),
          product_data: {
            name: `${piece.name} — ${piece.kanji}`,
            description: piece.note,
            images: [`${base}/images/products/${piece.folder}/1.webp`],
            metadata: { slug: piece.slug, sku: piece.sku },
          },
        },
      })),
      shipping_address_collection: {
        allowed_countries: [...SHIPPING_COUNTRIES],
      },
      shipping_options:
        shipping > 0
          ? [
              {
                shipping_rate_data: {
                  type: "fixed_amount",
                  fixed_amount: { amount: shipping * 100, currency: "aud" },
                  display_name: "International shipping (tracked)",
                },
              },
            ]
          : undefined,
      phone_number_collection: { enabled: true },
      // 一点物なので、決済画面を開いたまま置いておける時間を短くする。既定の 24 時間だと、
      // その間に別の人も同じ作品の決済画面を開けて、二人とも払えてしまう。Stripe の
      // 下限は 30 分（作成時刻から数えるので、ぎりぎりにすると弾かれる）。
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_HOLD_MINUTES * 60,
      // Webhook が注文を組み立てるときに読む。line_items から引き直すより確実。
      // lang は確認メールと thank-you の言語（決めるのはここだけ）。
      metadata: { slugs: pieces.map((p) => p.slug).join(","), lang },
      success_url: `${base}/checkout/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/collection`,
    });

    if (!session.url) return { error: ERRORS.noPage[lang] };
    redirect(session.url);
  } catch (error) {
    // redirect() は例外で制御を返すので、それは握り潰さずに投げ直す
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("[stripe] checkout session の作成に失敗", error);
    return { error: ERRORS.failed[lang] };
  }
}
