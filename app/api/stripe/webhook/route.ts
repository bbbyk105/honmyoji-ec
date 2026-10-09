import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";

import { aud, findByKey, getProduct, priceLabel, products } from "@/data/products";
import { getPieces } from "@/lib/catalog";
import { isLang } from "@/lib/lang";
import { notifyStore, sendToCustomer } from "@/lib/mail";
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

/** 知らせを出している配達が、落ちたまま印を残していたとき、次の再送が借り直せるまでの時間。 */
const LEASE_MS = 5 * 60_000;

/** 決済を作ったときに残した slug（重ねても getPieces / findByKey が一つにする）。 */
function metadataSlugs(session: Stripe.Checkout.Session): string[] {
  return String(session.metadata?.slugs ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * 何が売れたか。Stripe の明細（払った額）から組み、作品は **SKU で** カタログ（data/products.ts）から
 * 引く —— slug は仮の名前から作っていて、決済画面を開いている間に変わりうる。名前と SKU はコード側の
 * 値なので DB は読まない。値段は明細から（カタログの値段は払うまでの間に直されうる）。カタログから
 * 消えた作品も、メールには明細の名前で行を残す（slug は null）。明細が読めなければ metadata の slug で。
 */
async function soldLines(client: Stripe, session: Stripe.Checkout.Session): Promise<SoldLine[]> {
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
        (meta.sku ? products.find((p) => p.sku === meta.sku) : undefined) ??
        (meta.slug ? findByKey(products, meta.slug) : undefined);
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
  return (await getPieces(metadataSlugs(session))).map((p) => ({
    slug: p.slug,
    name: p.name,
    kanji: p.kanji,
    price: priceLabel(p) ?? "",
  }));
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

type MailKind = "store" | "customer" | "double_sale";

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
    event = await client.webhooks.constructEventAsync(raw, signature, webhookSecret, undefined, webCrypto);
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

  // 決済を作ったときの slug を、コード側のカタログで今の slug に揃える（DB は読まない）
  const recorded = [...new Set(metadataSlugs(session).flatMap((key) => findByKey(products, key)?.slug ?? []))];

  /** 知らせを出す印を借りている注文。落ちたらすぐ返して、次の再送が待たずに続きをやれるように */
  let leased: number | null = null;

  try {
    // 1. 注文の行。stripe_session が unique なので、再送でも二重に立たない
    const { error } = await supabase.from("orders").upsert(
      {
        stripe_session: session.id,
        stripe_intent:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null),
        slugs: recorded,
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

    // 2. 初めての配達か、途中で落ちた配達の続きか、知らせまで済んだ再送かは、行を読んで決める
    //    （「行が新しく入ったか」で決めると、途中で落ちた配達の続きを二度とやらない）
    const { data: row, error: readError } = await supabase
      .from("orders")
      .select("id,notified_at")
      .eq("stripe_session", session.id)
      .single();
    if (readError) throw readError;
    const orderId = row.id as number;
    // 知らせまで済んだ注文の再送は何もしない（あとで管理画面で販売中に戻した作品を、古い再送で
    // また完売にしない）
    if (row.notified_at) return NextResponse.json({ received: true });

    // 3. 知らせを出す印を借りる。同じ配達が同時に届いたら一方だけが進み、もう一方は 503 で
    //    Stripe にあとで送り直してもらう。落ちて印が残っても、LEASE_MS たてば次の再送が借り直せる
    const now = new Date().toISOString();
    const staleBefore = new Date(Date.now() - LEASE_MS).toISOString();
    const { data: lease, error: leaseError } = await supabase
      .from("orders")
      .update({ notifying_at: now })
      .eq("id", orderId)
      .is("notified_at", null)
      .or(`notifying_at.is.null,notifying_at.lt.${staleBefore}`)
      .select("id,mails_sent");
    if (leaseError) throw leaseError;
    if ((lease ?? []).length === 0) return NextResponse.json({ error: "in progress" }, { status: 503 });
    leased = orderId;
    const sent = new Set<string>((lease?.[0]?.mails_sent as string[] | null) ?? []);

    // 4. 何が売れたか（明細から）。完売にするのは、明細から引けた作品と決済に残した作品の両方 ——
    //    明細から引けない行があっても、払われた一点物を販売中のまま残さない
    const lines = await soldLines(client, session);
    const slugs = [...new Set([...lines.flatMap((l) => (l.slug ? [l.slug] : [])), ...recorded])];

    // 5. 完売に。何度呼んでも同じ結果になる（lib/mark-sold.ts）
    const clashes: SoldClash[] = await markSold(supabase, slugs, now, session.id);

    // 6. 知らせる。一通送るごとに「送り終えた」を残す —— 途中で落ちたら 500 で再送してもらい、
    //    送っていないものだけ送る
    const ref = orderRef(orderId);
    const studioUrl = siteUrl(`/studio/orders/${orderId}`);
    const intent =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    const amount = orderAmount({ amount_cents: session.amount_total ?? 0, currency: session.currency ?? "aud" });
    const customerName = session.customer_details?.name ?? null;
    const customerEmail = session.customer_details?.email ?? null;
    const pieces = lines.map((l) => ({ name: l.name, kanji: l.kanji, price: l.price }));
    // 決済を始めたときに決めた言語（lib/lang.ts）。それより前に作られた決済は英語
    const lang = isLang(session.metadata?.lang) ? session.metadata.lang : "en";

    const deliver = async (kind: MailKind, send: () => Promise<void>) => {
      if (sent.has(kind)) return;
      await send();
      sent.add(kind);
      const { error: markError } = await supabase.from("orders").update({ mails_sent: [...sent] }).eq("id", orderId);
      if (markError) throw markError;
    };

    await deliver("store", () =>
      notifyStore(
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
      ),
    );

    // お客さまへの確認は、取り違えが無いときだけ。二重に売れたかもしれない注文に
    // 「The piece is yours」と送ると、あとで返金するときに言ったことを取り消すことになる。
    // そのときはお店がどちらに渡すかを決めてから、自分で書く（doubleSaleMail に書いてある）。
    if (clashes.length === 0 && customerEmail) {
      await deliver("customer", () =>
        sendToCustomer(
          customerEmail,
          orderConfirmationMail({ ref, amount, customerName, shipping: address(session), pieces, lang }),
        ),
      );
    }
    if (clashes.length > 0) {
      console.error("[stripe] 決済の前に買えない状態だった作品", ref, clashes.map((c) => c.slug));
      await deliver("double_sale", () =>
        notifyStore(
          doubleSaleMail({
            ref,
            clashes: clashes.map((c) => {
              const product = getProduct(c.slug);
              return { name: product?.name ?? c.slug, kanji: product?.kanji ?? "", status: c.status };
            }),
            studioUrl,
            stripeUrl: intent ? `https://dashboard.stripe.com/payments/${intent}` : null,
          }),
        ),
      );
    }

    // 7. 終わった印。印を返す
    const { error: doneError } = await supabase
      .from("orders")
      .update({ notified_at: new Date().toISOString(), notifying_at: null })
      .eq("id", orderId);
    if (doneError) throw doneError;
  } catch (error) {
    console.error("[stripe] 注文の処理に失敗", error);
    if (leased !== null) {
      // 印を返す（postgrest-js は失敗しても投げない。返せなくても LEASE_MS たてば次の再送が借り直せる）
      await supabase.from("orders").update({ notifying_at: null }).eq("id", leased);
    }
    // 500 を返して Stripe に再送させる（決済は通っているので落としてはいけない）。再送では、
    // 完売をやり直し、送っていないメールだけ送る
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }

  revalidatePath("/");
  revalidatePath("/collection");
  revalidatePath("/collection/[slug]", "page");
  revalidatePath("/studio", "layout");

  return NextResponse.json({ received: true });
}
