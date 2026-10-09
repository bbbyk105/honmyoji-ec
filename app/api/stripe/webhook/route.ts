import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";

import { aud, findByKey, getProduct, products } from "@/data/products";
import { isLang } from "@/lib/lang";
import { isPermanentMailError, notifyStore, sendToCustomer } from "@/lib/mail";
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

/** 決済を作ったときに残した slug（重なっていても、呼び出し側が Set で一つにする）。 */
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
 * 消えた作品も、メールには明細の名前で行を残す（slug は null）。
 *
 * 明細が読めなければ**投げる**（500 で Stripe に再送してもらう）。metadata に黙って切り替えると、
 * slug が変わっていたときに作品を完売にできないまま「完売にしてあります」と知らせてしまう。
 */
async function soldLines(client: Stripe, session: Stripe.Checkout.Session): Promise<SoldLine[]> {
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
  return lines;
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

  const intent =
    typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);
  const shipping = address(session);

  /** 知らせを出す印（借りた時刻）。自分の印のときだけ書く —— 遅れた配達が、借り直した配達の印を消さない */
  let lease: { orderId: number; token: string } | null = null;

  try {
    // 1. 何が売れたか（明細から）。完売にするのは、明細から引けた作品と、決済に残した作品の両方 ——
    //    明細から引けない行があっても、払われた一点物を販売中のまま残さない
    const lines = await soldLines(client, session);
    const raw = metadataSlugs(session);
    const recorded = raw.flatMap((key) => findByKey(products, key)?.slug ?? []);
    const slugs = [...new Set([...lines.flatMap((l) => (l.slug ? [l.slug] : [])), ...recorded])];
    // 注文の行には、引けなかった slug も残す（あとで何が売れたかを追えるように）
    const orderSlugs = [...new Set([...slugs, ...raw])];

    // 2. 売れたことを記録する（注文の行・完売・二重販売の判定）。一つのトランザクションで、行を押さえて
    //    決める（supabase/migrations/0004_webhook_retry.sql の record_sale）。再送では最初に決めた結果を返す
    const { data: sale, error: saleError } = await supabase
      .rpc("record_sale", {
        p_session: session.id,
        p_intent: intent,
        p_slugs: slugs,
        p_order_slugs: orderSlugs,
        p_amount_cents: session.amount_total ?? 0,
        p_currency: session.currency ?? "aud",
        p_customer_name: session.customer_details?.name ?? null,
        p_customer_email: session.customer_details?.email ?? null,
        p_shipping: shipping,
        p_code_status: Object.fromEntries(slugs.map((slug) => [slug, getProduct(slug)?.status ?? null])),
      })
      .single();
    if (saleError) throw saleError;
    const result = sale as {
      sale_order_id: number;
      sale_notified_at: string | null;
      sale_mails_sent: string[] | null;
      sale_clashes: { slug: string; status: "sold_out" | "reserved" }[] | null;
    };
    const orderId = result.sale_order_id;
    const clashes = result.sale_clashes ?? [];

    // 売れたことは記録できた。メールより先に公開ページを作り直す（売れた一点物を出し続けない）
    revalidateCatalog();

    // 知らせまで済んだ注文の再送は何もしない
    if (result.sale_notified_at) return NextResponse.json({ received: true });

    // 3. 知らせを出す印を借りる。同じ配達が同時に届いたら一方だけが進み、もう一方は 503 で
    //    Stripe にあとで送り直してもらう。落ちて印が残っても、LEASE_MS たてば次の再送が借り直せる
    const token = new Date().toISOString();
    const staleBefore = new Date(Date.now() - LEASE_MS).toISOString();
    const { data: leased, error: leaseError } = await supabase
      .from("orders")
      .update({ notifying_at: token })
      .eq("id", orderId)
      .is("notified_at", null)
      .or(`notifying_at.is.null,notifying_at.lt.${staleBefore}`)
      .select("id,mails_sent");
    if (leaseError) throw leaseError;
    if ((leased ?? []).length === 0) return NextResponse.json({ error: "in progress" }, { status: 503 });
    lease = { orderId, token };
    const sent = new Set<string>((leased?.[0]?.mails_sent as string[] | null) ?? []);

    // 4. 知らせる。一通ごとに記録する。一時的な失敗は 500 で再送してもらい、送っていないものだけ
    //    送る。送り直しても届かない失敗（宛先の誤りなど）は「送れない」と記録して先へ進む
    const ref = orderRef(orderId);
    const studioUrl = siteUrl(`/studio/orders/${orderId}`);
    const amount = orderAmount({ amount_cents: session.amount_total ?? 0, currency: session.currency ?? "aud" });
    const customerName = session.customer_details?.name ?? null;
    const customerEmail = session.customer_details?.email ?? null;
    const pieces = lines.map((l) => ({ name: l.name, kanji: l.kanji, price: l.price }));
    // 決済を始めたときに決めた言語（lib/lang.ts）。それより前に作られた決済は英語
    const lang = isLang(session.metadata?.lang) ? session.metadata.lang : "en";

    const deliver = async (kind: MailKind, send: () => Promise<void>) => {
      if (sent.has(kind) || sent.has(`${kind}:failed`)) return;
      try {
        await send();
        sent.add(kind);
      } catch (error) {
        if (!isPermanentMailError(error)) throw error;
        console.error(`[stripe] ${ref} の ${kind} のメールは送れません（送り直しても届かない）`, error);
        sent.add(`${kind}:failed`);
      }
      const { data: marked, error: markError } = await supabase
        .from("orders")
        .update({ mails_sent: [...sent] })
        .eq("id", orderId)
        .eq("notifying_at", token)
        .select("id");
      if (markError) throw markError;
      if ((marked ?? []).length === 0) throw new Error("知らせの印が別の配達に移った");
    };

    await deliver("store", () =>
      notifyStore(orderPlacedMail({ ref, amount, customerName, customerEmail, customerLang: lang, shipping, pieces, studioUrl })),
    );

    // お客さまへの確認は、取り違えが無いときだけ。二重に売れたかもしれない注文に
    // 「The piece is yours」と送ると、あとで返金するときに言ったことを取り消すことになる。
    // そのときはお店がどちらに渡すかを決めてから、自分で書く（doubleSaleMail に書いてある）。
    if (clashes.length === 0 && customerEmail) {
      await deliver("customer", () =>
        sendToCustomer(customerEmail, orderConfirmationMail({ ref, amount, customerName, shipping, pieces, lang })),
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

    // 5. 終わった印。自分の印のときだけ
    const { error: doneError } = await supabase
      .from("orders")
      .update({ notified_at: new Date().toISOString(), notifying_at: null })
      .eq("id", orderId)
      .eq("notifying_at", token);
    if (doneError) throw doneError;
  } catch (error) {
    console.error("[stripe] 注文の処理に失敗", error);
    if (lease) {
      // 自分の印なら返す（postgrest-js は失敗しても投げない。返せなくても LEASE_MS で借り直せる）
      await supabase.from("orders").update({ notifying_at: null }).eq("id", lease.orderId).eq("notifying_at", lease.token);
    }
    // 500 を返して Stripe に再送させる（決済は通っているので落としてはいけない）。再送では、
    // 記録は最初の結果のまま、送っていないメールだけ送る
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/** 売れた作品が出るページを作り直す。 */
function revalidateCatalog(): void {
  revalidatePath("/");
  revalidatePath("/collection");
  revalidatePath("/collection/[slug]", "page");
  revalidatePath("/studio", "layout");
}
