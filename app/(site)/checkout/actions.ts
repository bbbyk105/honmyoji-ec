"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getPieces, toCents } from "@/lib/catalog";
import { SHIPPING_AUD, SHIPPING_COUNTRIES, stripe } from "@/lib/stripe";

/* ------------------------------------------------------------------
   カート → Stripe Checkout。

   商品は Stripe 側に登録しない。一点物で、価格も文言も data/products.ts と
   管理画面が正本なので、二重に持つと必ずどちらかが古くなる。毎回 price_data
   でその場に組む。
   ------------------------------------------------------------------ */

export type CheckoutState = { error?: string };

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
  const client = stripe();
  if (!client) {
    return { error: "決済の準備がまだできていません。お問い合わせからご連絡ください。" };
  }

  const slugs = String(formData.get("slugs") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (slugs.length === 0) return { error: "カートが空です。" };

  const pieces = await getPieces(slugs);
  if (pieces.length === 0) return { error: "カートの品が見つかりませんでした。" };

  // 一点物なので、決済に進む直前にもう一度状態を見る。カートに入れたあとで
  // 別の人が買った、という取り違えがいちばん起きやすい。
  const unavailable = pieces.filter((p) => p.status !== "available");
  if (unavailable.length > 0) {
    const names = unavailable.map((p) => p.name).join(", ");
    return {
      error: `${names} は今お求めいただけません。カートから外してからお進みください。`,
    };
  }

  const base = await origin();

  try {
    const session = await client.checkout.sessions.create({
      mode: "payment",
      currency: "aud",
      line_items: pieces.map((piece) => ({
        quantity: 1,
        price_data: {
          currency: "aud",
          unit_amount: toCents(piece.priceAud),
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
        SHIPPING_AUD > 0
          ? [
              {
                shipping_rate_data: {
                  type: "fixed_amount",
                  fixed_amount: { amount: SHIPPING_AUD * 100, currency: "aud" },
                  display_name: "International shipping (tracked)",
                },
              },
            ]
          : undefined,
      phone_number_collection: { enabled: true },
      // Webhook が注文を組み立てるときに読む。line_items から引き直すより確実。
      metadata: { slugs: pieces.map((p) => p.slug).join(",") },
      success_url: `${base}/checkout/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/collection`,
    });

    if (!session.url) return { error: "決済ページを開けませんでした。" };
    redirect(session.url);
  } catch (error) {
    // redirect() は例外で制御を返すので、それは握り潰さずに投げ直す
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("[stripe] checkout session の作成に失敗", error);
    return { error: "決済ページを開けませんでした。少し待ってからもう一度お試しください。" };
  }
}
