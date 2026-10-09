import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";

import { aud, findByKey, getProduct, products } from "@/data/products";
import { isLang } from "@/lib/lang";
import { isPermanentMailError, notifyStore, sendToCustomer } from "@/lib/mail";
import { doubleSaleMail, orderConfirmationMail, orderPlacedMail, type CustomerMailState } from "@/lib/order-mail";
import { orderAmount, orderRef } from "@/lib/orders";
import { revalidateCatalogPages } from "@/lib/revalidate-catalog";
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

/** メールに載せる一行。slug はカタログから引けた作品（引けなければ null）。 */
type SoldLine = { slug: string | null; name: string; kanji: string; price: string };

/** 知らせを出している配達が、落ちたまま印を残していたとき、次の再送が借り直せるまでの時間。 */
const LEASE_MS = 5 * 60_000;

/**
 * 完売にする作品。決済を作ったときに残した SKU（変わらない）と slug（仮の名前から作っていて、
 * 決済画面を開いている間に変わりうる）の両方から、カタログ（data/products.ts）で引く。Stripe の
 * API を待たない —— 明細を読みに行って落ちると、再送までの間、払われた一点物が買えたままになる。
 * 注文の行には、引けなかった slug も残す（あとで何が売れたかを追えるように）。
 */
function soldPieces(session: Stripe.Checkout.Session): { slugs: string[]; orderSlugs: string[] } {
  const list = (key: "skus" | "slugs") =>
    String(session.metadata?.[key] ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  const rawSlugs = list("slugs");
  const bySku = list("skus").flatMap((sku) => products.find((p) => p.sku === sku)?.slug ?? []);
  const bySlug = rawSlugs.flatMap((key) => findByKey(products, key)?.slug ?? []);
  const slugs = [...new Set([...bySku, ...bySlug])];
  return { slugs, orderSlugs: [...new Set([...slugs, ...rawSlugs])] };
}

/**
 * メールに載せる明細。Stripe の明細（払った額）から組み、作品は **SKU で** カタログから引く。
 * 名前と SKU はコード側の値なので DB は読まない。値段は明細から（カタログの値段は払うまでの間に
 * 直されうる）。カタログから消えた作品も、明細の名前で行を残す（slug は null）。
 *
 * 明細が読めなければ**投げる**（500 で Stripe に再送してもらう。売れたことの記録はもう済んでいる）。
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
    // 1. 売れたことを記録する（注文の行・完売・二重販売の判定）。一つのトランザクションで、行を押さえて
    //    決める（supabase/migrations/0004_webhook_retry.sql の record_sale）。再送では最初に決めた結果を返す
    const { slugs, orderSlugs } = soldPieces(session);
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
      sale_clashes: { slug: string; status: "sold_out" | "reserved" }[] | null;
    };
    const orderId = result.sale_order_id;
    const clashes = result.sale_clashes ?? [];

    // 売れたことは記録できた。メールより先に公開ページを作り直す（売れた一点物を出し続けない）
    revalidateCatalogPages();
    revalidatePath("/studio", "layout");

    // 知らせまで済んだ注文の再送は何もしない（Stripe の API も呼ばない）
    if (result.sale_notified_at) return NextResponse.json({ received: true });

    // 2. メールに載せる明細
    const lines = await soldLines(client, session);

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

    /** 送り終えたメールを記録する。自分の印のときだけ */
    const mark = async () => {
      const { data: marked, error: markError } = await supabase
        .from("orders")
        .update({ mails_sent: [...sent] })
        .eq("id", orderId)
        .eq("notifying_at", token)
        .select("id");
      if (markError) throw markError;
      if ((marked ?? []).length === 0) throw new Error("知らせの印が別の配達に移った");
    };
    /** Resend の Idempotency-Key。送れたのに応答が遅れて失敗に見えても、再送が二通目にならない */
    const once = (kind: string) => `${session.id}:${kind}`;

    // 4. 知らせる。一通ごとに記録し、失敗したら 500 で再送してもらう（送っていないものだけ送る）
    const ref = orderRef(orderId);
    const studioUrl = siteUrl(`/studio/orders/${orderId}`);
    const amount = orderAmount({ amount_cents: session.amount_total ?? 0, currency: session.currency ?? "aud" });
    const customerName = session.customer_details?.name ?? null;
    const customerEmail = session.customer_details?.email ?? null;
    const sold = new Set(slugs);
    const pieces = lines.map((l) => ({
      name: l.name,
      kanji: l.kanji,
      price: l.price,
      soldOut: l.slug !== null && sold.has(l.slug),
    }));
    // 決済を始めたときに決めた言語（lib/lang.ts）。それより前に作られた決済は英語
    const lang = isLang(session.metadata?.lang) ? session.metadata.lang : "en";

    // お客さまへの確認が先 —— お店へのメールに、送れたかどうかを書くため。
    // 確認は取り違えが無いときだけ。二重に売れたかもしれない注文に「The piece is yours」と送ると、
    // あとで返金するときに言ったことを取り消すことになる（お店が決めてから自分で書く。doubleSaleMail）。
    let customerRefused = false;
    if (clashes.length === 0 && customerEmail && !sent.has("customer") && !sent.has("customer:failed")) {
      try {
        await sendToCustomer(customerEmail, {
          ...orderConfirmationMail({ ref, amount, customerName, shipping, pieces, lang }),
          idempotencyKey: once("customer"),
        });
        sent.add("customer");
        await mark();
      } catch (error) {
        // Resend が断った（4xx）。宛先の誤りか、鍵や送り元の設定の誤りかは、お店へのメールが通るかで
        // 分かる —— 通らなければ下で投げて 500（設定を直せば再送で両方届く）
        if (!isPermanentMailError(error)) throw error;
        console.error(`[stripe] ${ref} の確認メールを Resend が断りました`, error);
        customerRefused = true;
      }
    }
    const customerMail: CustomerMailState =
      clashes.length > 0
        ? "held"
        : !customerEmail
          ? "no_email"
          : sent.has("customer")
            ? "sent"
            : "failed";

    if (!sent.has("store")) {
      await notifyStore({
        ...orderPlacedMail({
          ref,
          amount,
          customerName,
          customerEmail,
          customerLang: lang,
          customerMail,
          shipping,
          pieces,
          studioUrl,
        }),
        idempotencyKey: once("store"),
      });
      sent.add("store");
    }
    // お店には届いた = 設定は生きている。断られたのはお客さまの宛先なので、送り直さない（3 日再送させない）
    if (customerRefused) sent.add("customer:failed");
    await mark();

    if (clashes.length > 0 && !sent.has("double_sale")) {
      console.error("[stripe] 決済の前に買えない状態だった作品", ref, clashes.map((c) => c.slug));
      await notifyStore({
        ...doubleSaleMail({
          ref,
          clashes: clashes.map((c) => {
            const product = getProduct(c.slug);
            return { name: product?.name ?? c.slug, kanji: product?.kanji ?? "", status: c.status };
          }),
          studioUrl,
          stripeUrl: intent ? `https://dashboard.stripe.com/payments/${intent}` : null,
        }),
        idempotencyKey: once("double_sale"),
      });
      sent.add("double_sale");
      await mark();
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
