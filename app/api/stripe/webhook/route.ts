import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";

import { priceLabel } from "@/data/products";
import { getPieces } from "@/lib/catalog";
import { isLang } from "@/lib/lang";
import { notifyStoreQuietly, sendToCustomerQuietly, siteLink } from "@/lib/mail";
import { clashesBefore, doubleSaleMail, orderConfirmationMail, orderPlacedMail } from "@/lib/order-mail";
import { orderAmount, orderRef } from "@/lib/orders";
import { stripe, webCrypto } from "@/lib/stripe";
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
    event = await client.webhooks.constructEventAsync(
      raw,
      signature,
      webhookSecret,
      undefined,
      webCrypto,
    );
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

  // 重ねない。同じ slug が二つあると、下の piece_overrides の upsert が同じ主キーを
  // 二行出して DB に弾かれ、再送のたびに 500 になる（作品は販売中のまま残る）。
  // 決済を作る側でも一つにしているが、それ以前に作られた決済画面のぶんもここで受ける。
  const slugs = [
    ...new Set(
      String(session.metadata?.slugs ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];

  // 印を付ける前の状態。決済が通る前にもう売れていた（取り置かれていた）作品が無いかを
  // 見る —— 一点物で、同じ作品の決済画面が二つ開いていれば二人とも払えてしまう。
  const before = await getPieces(slugs);

  let orderId: number | null = null;

  try {
    // stripe_session が unique なので、Stripe が同じイベントを再送しても
    // 二重に注文が立たない。返ってくるのは新しく入った行だけ（再送なら空）。
    const { data: inserted, error } = await supabase.from("orders").upsert(
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
    ).select("id");
    if (error) throw error;
    const id = inserted?.[0]?.id;
    if (typeof id === "number") orderId = id;

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

  // お店に知らせるのは初めて入った注文のときだけ（再送のたびに届かないように）。
  // 送れなくても 200 を返す —— 注文は保存できているので、Stripe に再送させる理由が無い。
  if (orderId !== null) {
    const ref = orderRef(orderId);
    const studioUrl = siteLink(`/studio/orders/${orderId}`);
    const intent =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

    const amount = orderAmount({ amount_cents: session.amount_total ?? 0, currency: session.currency ?? "aud" });
    const customerName = session.customer_details?.name ?? null;
    const customerEmail = session.customer_details?.email ?? null;
    const pieces = before.map((p) => ({ name: p.name, kanji: p.kanji, price: priceLabel(p) }));
    // 決済を始めたときに決めた言語（lib/lang.ts）。それより前に作られた決済は英語
    const lang = isLang(session.metadata?.lang) ? session.metadata.lang : "en";

    await notifyStoreQuietly(
      orderPlacedMail({
        ref,
        amount,
        customerName,
        customerEmail,
        customerLang: lang,
        shipping: address(session),
        pieces,
        studioUrl,
      }),
    );

    const clashes = clashesBefore(before);
    // お客さまへの確認は、取り違えが無いときだけ。二重に売れたかもしれない注文に
    // 「The piece is yours」と送ると、あとで返金するときに言ったことを取り消すことになる。
    // そのときはお店がどちらに渡すかを決めてから、自分で書く（doubleSaleMail に書いてある）。
    if (clashes.length === 0 && customerEmail) {
      await sendToCustomerQuietly(
        customerEmail,
        orderConfirmationMail({ ref, amount, customerName, shipping: address(session), pieces, lang }),
      );
    }
    if (clashes.length > 0) {
      console.error("[stripe] 決済の前に買えない状態だった作品", ref, clashes.map((p) => p.name));
      await notifyStoreQuietly(
        doubleSaleMail({
          ref,
          clashes,
          studioUrl,
          stripeUrl: intent ? `https://dashboard.stripe.com/payments/${intent}` : null,
        }),
      );
    }
  }

  revalidatePath("/");
  revalidatePath("/collection");
  revalidatePath("/collection/[slug]", "page");
  revalidatePath("/studio", "layout");

  return NextResponse.json({ received: true });
}
