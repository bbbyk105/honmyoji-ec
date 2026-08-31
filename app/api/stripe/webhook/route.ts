import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { db } from "@/lib/supabase";

/* ------------------------------------------------------------------
   Stripe Webhook — 決済が通った事実はここでだけ確定させる。

   ブラウザが戻ってくる success_url では確定しない。カードは通ったのに客が
   タブを閉じた、という一番ありふれた経路で注文が消えるため。

   Stripe 側の設定（docs/stripe.md）:
     エンドポイント  https://<本番ドメイン>/api/stripe/webhook
     イベント        checkout.session.completed
   ------------------------------------------------------------------ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function address(session: Stripe.Checkout.Session) {
  const shipping = session.collected_information?.shipping_details ?? null;
  if (!shipping?.address) return null;
  const a = shipping.address;
  return {
    name: shipping.name ?? undefined,
    line1: a.line1 ?? undefined,
    line2: a.line2 ?? undefined,
    city: a.city ?? undefined,
    state: a.state ?? undefined,
    postal_code: a.postal_code ?? undefined,
    country: a.country ?? undefined,
    phone: session.customer_details?.phone ?? undefined,
  };
}

export async function POST(request: NextRequest) {
  const client = stripe();
  if (!client || !webhookSecret) {
    console.error("[stripe] STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET が未設定");
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "no signature" }, { status: 400 });

  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = client.webhooks.constructEvent(raw, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe] 署名の検証に失敗", error);
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }

  const supabase = db();
  if (!supabase) {
    // 200 を返すと Stripe は再送しない。DB が無いうちは失敗として残す。
    console.error("[stripe] DB 未設定のため注文を保存できない", session.id);
    return NextResponse.json({ error: "no database" }, { status: 500 });
  }

  const slugs = String(session.metadata?.slugs ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    // stripe_session が unique なので、Stripe が同じイベントを再送しても
    // 二重に注文が立たない。
    const { error } = await supabase.from("orders").upsert(
      {
        stripe_session: session.id,
        stripe_intent:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null),
        slugs,
        amount_cents: session.amount_total ?? 0,
        currency: session.currency ?? "aud",
        status: "paid",
        customer_name: session.customer_details?.name ?? null,
        customer_email: session.customer_details?.email ?? null,
        shipping: address(session),
      },
      { onConflict: "stripe_session", ignoreDuplicates: true },
    );
    if (error) throw error;

    // 一点物なので、売れたら在庫から下ろす。ここを手作業にすると、二人目に
    // 買える状態のまま見えてしまう時間が必ずできる。
    if (slugs.length > 0) {
      const now = new Date().toISOString();
      const { error: soldError } = await supabase.from("piece_overrides").upsert(
        slugs.map((slug) => ({ slug, status: "sold_out", updated_at: now })),
        { onConflict: "slug" },
      );
      if (soldError) throw soldError;
    }
  } catch (error) {
    console.error("[stripe] 注文の保存に失敗", error);
    // 500 を返して Stripe に再送させる（決済は通っているので落としてはいけない）
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }

  revalidatePath("/");
  revalidatePath("/collection");
  revalidatePath("/collection/[slug]", "page");
  revalidatePath("/studio", "layout");

  return NextResponse.json({ received: true });
}
