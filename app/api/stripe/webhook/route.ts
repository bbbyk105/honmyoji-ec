import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";

import { aud, findByKey, getProduct, priceLabel } from "@/data/products";
import { getCatalog, getPieces } from "@/lib/catalog";
import { isLang } from "@/lib/lang";
import { notifyStoreQuietly, sendToCustomerQuietly } from "@/lib/mail";
import { markSold, type SoldClash } from "@/lib/mark-sold";
import { doubleSaleMail, orderConfirmationMail, orderPlacedMail } from "@/lib/order-mail";
import { orderAmount, orderRef } from "@/lib/orders";
import { siteUrl } from "@/lib/site-url";
import { stripe, webCrypto } from "@/lib/stripe";
import { db } from "@/lib/supabase";

/* ------------------------------------------------------------------
   Stripe Webhook — 決済が通った事実はここでだけ確定させる。

   ブラウザが戻ってくる success_url では確定しない。カードは通ったのに客が
   タブを閉じた、という一番ありふれた経路で注文が消えるため。

   Stripe 側の設定（docs/studio.md）:
     エンドポイント  https://<本番ドメイン>/api/stripe/webhook
     イベント        checkout.session.completed
                     checkout.session.async_payment_succeeded（後払い型の支払い方法の入金）
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

/** メールに載せる一行と、完売にする作品。 */
type SoldLine = { slug: string | null; name: string; kanji: string; price: string };

/**
 * 何が売れたか。Stripe の明細（払った額）から組み、作品は **SKU で** 今のカタログから引く ——
 * slug は仮の名前から作っていて、決済画面を開いている間に変わりうる（名前が届いたとき）。
 * 値段も明細から（カタログの値段は払うまでの間に直されうる）。カタログから消えた作品も、
 * メールには明細の名前で行を残す（slug は null で、完売にはしない）。
 * 明細が読めなければ、決済の metadata の slug を今のカタログで引く。
 */
async function soldLines(client: Stripe, session: Stripe.Checkout.Session): Promise<SoldLine[]> {
  const catalog = await getCatalog();
  try {
    const items = await client.checkout.sessions.listLineItems(session.id, {
      limit: 100,
      expand: ["data.price.product"],
    });
    const lines: SoldLine[] = [];
    for (const item of items.data) {
      const product = item.price?.product;
      const live = typeof product === "object" && product !== null && !("deleted" in product && product.deleted);
      const meta = live ? (product as Stripe.Product).metadata : {};
      const piece =
        (meta.sku ? catalog.find((p) => p.sku === meta.sku) : undefined) ??
        (meta.slug ? findByKey(catalog, meta.slug) : undefined);
      const price = aud.format(item.amount_total / 100 / (item.quantity || 1));
      if (piece) {
        if (!lines.some((l) => l.slug === piece.slug)) {
          lines.push({ slug: piece.slug, name: piece.name, kanji: piece.kanji, price });
        }
      } else {
        lines.push({ slug: null, name: item.description ?? (live ? (product as Stripe.Product).name : "—"), kanji: "", price });
      }
    }
    if (lines.length > 0) return lines;
  } catch (error) {
    console.error("[stripe] 明細を読めませんでした（metadata の slug で組む）", error);
  }
  // 重ねない（同じ slug が二つあると完売の書き込みが同じ主キーを二行出して弾かれる）
  const slugs = [
    ...new Set(
      String(session.metadata?.slugs ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  ];
  return (await getPieces(slugs)).map((p) => ({ slug: p.slug, name: p.name, kanji: p.kanji, price: priceLabel(p) ?? "" }));
}

/**
 * 売れたと決める決済。二つだけ —— カードは completed の時点で paid。銀行振込のような後払い型の
 * 支払い方法は completed では unpaid で、入金が済むと async_payment_succeeded が来る（監査 10）。
 * 後払い型を Stripe のダッシュボードで有効にしたときに、入金済みの注文が消えないように。
 */
function soldSession(event: Stripe.Event): Stripe.Checkout.Session | null {
  if (event.type === "checkout.session.completed") {
    return event.data.object.payment_status === "paid" ? event.data.object : null;
  }
  if (event.type === "checkout.session.async_payment_succeeded") return event.data.object;
  return null;
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

  const session = soldSession(event);
  if (!session) {
    return NextResponse.json({ received: true });
  }

  const supabase = db();
  if (!supabase) {
    // 200 を返すと Stripe は再送しない。DB が無いうちは失敗として残す。
    console.error("[stripe] DB 未設定のため注文を保存できない", session.id);
    return NextResponse.json({ error: "no database" }, { status: 500 });
  }

  const lines = await soldLines(client, session);
  const slugs = lines.flatMap((l) => (l.slug ? [l.slug] : []));

  let order: { id: number; notified_at: string | null };
  let clashes: SoldClash[] = [];

  try {
    // stripe_session が unique なので、Stripe が同じイベントを再送しても二重に注文が立たない
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

    // 初めての配達か、前の配達が途中で落ちた再送か、知らせまで済んだ再送かは、行を読んで決める
    // （「行が新しく入ったか」で決めると、途中で落ちた配達の続きを二度とやらない）
    const { data: row, error: readError } = await supabase
      .from("orders")
      .select("id,notified_at")
      .eq("stripe_session", session.id)
      .single();
    if (readError) throw readError;
    order = { id: row.id as number, notified_at: (row.notified_at as string | null) ?? null };

    // 知らせまで済んだ注文の再送は何もしない（あとで管理画面で販売中に戻した作品を、古い再送で
    // また完売にしない）
    if (order.notified_at !== null) return NextResponse.json({ received: true });

    // 一点物なので、売れたら在庫から下ろす。何度呼んでも同じ結果になる（lib/mark-sold.ts）
    clashes = await markSold(supabase, slugs, new Date().toISOString(), session.id);

    // 知らせる権利を先に取る。同じ配達が同時に二つ届いても、送るのはここを取った方だけ
    const { data: claimed, error: claimError } = await supabase
      .from("orders")
      .update({ notified_at: new Date().toISOString() })
      .eq("id", order.id)
      .is("notified_at", null)
      .select("id");
    if (claimError) throw claimError;
    if ((claimed ?? []).length === 0) return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[stripe] 注文の保存に失敗", error);
    // 500 を返して Stripe に再送させる（決済は通っているので落としてはいけない）。再送では、
    // 知らせ済みでない限り、完売と知らせをもう一度やる
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }

  // 知らせる。送れなくても 200 を返す —— 注文は保存できていて、知らせる権利も取ってあるので、
  // 再送させると二通目が出る
  {
    const ref = orderRef(order.id);
    const studioUrl = siteUrl(`/studio/orders/${order.id}`);
    const intent =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

    const amount = orderAmount({ amount_cents: session.amount_total ?? 0, currency: session.currency ?? "aud" });
    const customerName = session.customer_details?.name ?? null;
    const customerEmail = session.customer_details?.email ?? null;
    const pieces = lines.map((l) => ({ name: l.name, kanji: l.kanji, price: l.price }));
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
      console.error("[stripe] 決済の前に買えない状態だった作品", ref, clashes.map((c) => c.slug));
      await notifyStoreQuietly(
        doubleSaleMail({
          ref,
          clashes: clashes.map((c) => {
            const product = getProduct(c.slug);
            return { name: product?.name ?? c.slug, kanji: product?.kanji ?? "", status: c.status };
          }),
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
