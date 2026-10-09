/**
 * @jest-environment node
 */

// Stripe の Webhook（app/api/stripe/webhook/route.ts）の流れ。売れたことの記録（record_sale）の中身は
// supabase/tests/record-sale.test.mjs が本物の Postgres（PGlite）で確かめる。ここでは記録のあとの
// 知らせが再送に強いことを見る:
//   - 初めての配達で、お店とお客さまに一通ずつ
//   - 知らせまで済んだ注文の再送では何もしない
//   - 途中で落ちたら 500。再送では送っていないメールだけ送る
//   - 送り直しても届かないメールは「送れない」と記録して先へ進む（3 日再送させない）
//   - 別の配達が知らせを出していたら 503
// Stripe とメールは差し替え、DB（PostgREST）は偽物の fetch。

export {};

jest.mock("server-only", () => ({}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

const mails: { kind: string; subject: string }[] = [];
/** お客さまへのメールを一度だけ失敗させる。permanent なら送り直しても届かない種類 */
let failCustomerOnce: null | { permanent: boolean } = null;
jest.mock("@/lib/mail", () => ({
  notifyStore: jest.fn(async (mail: { subject: string }) => {
    mails.push({ kind: "store", subject: mail.subject });
  }),
  sendToCustomer: jest.fn(async (_to: string, mail: { subject: string }) => {
    if (failCustomerOnce) {
      const { permanent } = failCustomerOnce;
      failCustomerOnce = null;
      throw Object.assign(new Error(permanent ? "Resend 422" : "Resend 503"), { permanent });
    }
    mails.push({ kind: "customer", subject: mail.subject });
  }),
  isPermanentMailError: (error: unknown) => (error as { permanent?: boolean })?.permanent === true,
}));

import { products } from "@/data/products";

const piece = products[0];
const SESSION = "cs_live_test123";

const session = {
  id: SESSION,
  payment_status: "paid",
  payment_intent: "pi_1",
  amount_total: 18500,
  currency: "aud",
  metadata: { slugs: piece.slug, lang: "en" },
  customer_details: { name: "Jane", email: "jane@example.com", phone: null },
  collected_information: null,
};

/** 明細の作品（SKU と slug）。空にすると、明細から作品を引けない行になる */
let lineMeta: Record<string, string> = { slug: piece.slug, sku: piece.sku };
let lineItemsDown = false;

jest.mock("@/lib/stripe", () => ({
  webCrypto: {},
  stripe: () => ({
    webhooks: {
      constructEventAsync: async () => ({ type: "checkout.session.completed", data: { object: session } }),
    },
    checkout: {
      sessions: {
        listLineItems: async () => {
          if (lineItemsDown) throw new Error("Stripe 503");
          return {
            data: [
              {
                amount_total: 14500,
                quantity: 1,
                description: `${piece.name} — ${piece.kanji}`,
                price: { product: { metadata: lineMeta, name: piece.name } },
              },
            ],
          };
        },
      },
    },
  }),
}));

// ---- 偽物の DB --------------------------------------------------------------------------
type Order = {
  id: number;
  stripe_session: string;
  recorded: boolean;
  clashes: { slug: string; status: string }[];
  notified_at: string | null;
  notifying_at: string | null;
  mails_sent: string[];
};
let orders: Order[];
let pieces: Map<string, { status: string | null; sold_session: string | null }>;
let failNextSale: boolean;
let saleCalls: { p_slugs: string[]; p_order_slugs: string[] }[];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** record_sale の振る舞いの写し（本物は supabase/tests で確かめる） */
function recordSale(p: {
  p_session: string;
  p_slugs: string[];
  p_order_slugs: string[];
  p_code_status: Record<string, string | null>;
}) {
  let o = orders.find((x) => x.stripe_session === p.p_session);
  if (!o) {
    o = { id: orders.length + 1, stripe_session: p.p_session, recorded: false, clashes: [], notified_at: null, notifying_at: null, mails_sent: [] };
    orders.push(o);
  }
  if (!o.recorded) {
    for (const slug of p.p_slugs) {
      const cur = pieces.get(slug) ?? { status: null, sold_session: null };
      const effective = cur.status ?? p.p_code_status[slug];
      if ((effective === "sold_out" || effective === "reserved") && cur.sold_session !== p.p_session) {
        o.clashes.push({ slug, status: effective });
        pieces.set(slug, { status: "sold_out", sold_session: cur.sold_session });
      } else {
        pieces.set(slug, { status: "sold_out", sold_session: p.p_session });
      }
    }
    o.recorded = true;
  }
  return { sale_order_id: o.id, sale_notified_at: o.notified_at, sale_mails_sent: o.mails_sent, sale_clashes: o.clashes };
}

const fakeFetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = new URL(String(input));
  const method = init?.method ?? "GET";
  const body = init?.body ? JSON.parse(String(init.body)) : null;

  if (url.pathname.endsWith("/rpc/record_sale")) {
    if (failNextSale) {
      failNextSale = false;
      return json({ message: "down" }, 503);
    }
    saleCalls.push(body);
    return json(recordSale(body));
  }

  if (url.pathname.endsWith("/orders") && method === "PATCH") {
    const o = orders.find((x) => x.id === Number(url.searchParams.get("id")?.replace(/^eq\./, "")));
    if (!o) return json([]);
    const token = url.searchParams.get("notifying_at");
    if (url.searchParams.get("notified_at") === "is.null") {
      // 印を借りる
      const staleBefore = /notifying_at\.lt\.([^,)]+)/.exec(url.searchParams.get("or") ?? "")?.[1] ?? "";
      const free = o.notifying_at === null || o.notifying_at < staleBefore;
      if (o.notified_at !== null || !free) return json([]);
      o.notifying_at = body.notifying_at;
      return json([{ id: o.id, mails_sent: o.mails_sent }]);
    }
    if (token?.startsWith("eq.") && o.notifying_at !== token.slice(3)) return json([]);
    Object.assign(o, body);
    return json([{ id: o.id }]);
  }

  return json([]);
});

type Route = typeof import("@/app/api/stripe/webhook/route");

function load(): Route {
  const saved = { ...process.env };
  process.env.SUPABASE_URL = "https://abc.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  let mod!: Route;
  jest.isolateModules(() => {
    mod = jest.requireActual<Route>("@/app/api/stripe/webhook/route");
  });
  process.env = saved;
  return mod;
}

function deliver(route: Route) {
  const request = new Request("https://honmyoujifuji.com/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": "t=1,v1=x" },
    body: "{}",
  });
  return route.POST(request as unknown as Parameters<Route["POST"]>[0]);
}

beforeEach(() => {
  orders = [];
  pieces = new Map([[piece.slug, { status: "available", sold_session: null }]]);
  failNextSale = false;
  failCustomerOnce = null;
  lineMeta = { slug: piece.slug, sku: piece.sku };
  lineItemsDown = false;
  saleCalls = [];
  mails.length = 0;
  global.fetch = fakeFetch as unknown as typeof fetch;
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("Stripe Webhook", () => {
  it("初めての配達: 売れたことを記録し、お店とお客さまに一通ずつ。終わったら印を返す", async () => {
    const res = await deliver(load());
    expect(res.status).toBe(200);
    expect(pieces.get(piece.slug)).toEqual({ status: "sold_out", sold_session: SESSION });
    expect(mails.map((m) => m.kind)).toEqual(["store", "customer"]);
    expect(orders[0]).toMatchObject({ notifying_at: null, mails_sent: ["store", "customer"] });
    expect(orders[0].notified_at).not.toBeNull();
  });

  it("知らせまで済んだ注文の再送: メールを二度送らない", async () => {
    const route = load();
    await deliver(route);
    mails.length = 0;
    const res = await deliver(route);
    expect(res.status).toBe(200);
    expect(mails).toEqual([]);
  });

  it("記録で落ちたら 500。再送で記録と知らせをやり直す", async () => {
    const route = load();
    failNextSale = true;
    expect((await deliver(route)).status).toBe(500);
    expect(mails).toEqual([]);
    expect((await deliver(route)).status).toBe(200);
    expect(mails.map((m) => m.kind)).toEqual(["store", "customer"]);
  });

  it("お客さまへのメールが一時的に落ちたら 500 で印を返す。再送では、お客さまへの一通だけ送る", async () => {
    const route = load();
    failCustomerOnce = { permanent: false };
    expect((await deliver(route)).status).toBe(500);
    expect(mails.map((m) => m.kind)).toEqual(["store"]);
    expect(orders[0].notifying_at).toBeNull();

    expect((await deliver(route)).status).toBe(200);
    expect(mails.map((m) => m.kind)).toEqual(["store", "customer"]);
  });

  it("送り直しても届かないメールは「送れない」と記録して先へ進み、200 を返す（3 日再送させない）", async () => {
    failCustomerOnce = { permanent: true };
    const res = await deliver(load());
    expect(res.status).toBe(200);
    expect(orders[0].mails_sent).toEqual(["store", "customer:failed"]);
    expect(orders[0].notified_at).not.toBeNull();
  });

  it("二重販売なら、お客さまには送らず、お店に要確認を送る", async () => {
    pieces.set(piece.slug, { status: "sold_out", sold_session: "cs_live_other" });
    const res = await deliver(load());
    expect(res.status).toBe(200);
    expect(mails.map((m) => m.kind)).toEqual(["store", "store"]);
    expect(mails[1].subject).toContain("要確認");
  });

  it("別の配達がいま知らせを出していたら、送らずに 503（あとで送り直してもらう）", async () => {
    const route = load();
    await deliver(route);
    // 記録だけ済んでいて、別の配達が印を借りている
    orders[0].notified_at = null;
    orders[0].notifying_at = new Date().toISOString();
    mails.length = 0;
    expect((await deliver(route)).status).toBe(503);
    expect(mails).toEqual([]);
  });

  it("明細から作品を引けなくても、決済に残した作品を完売にする", async () => {
    lineMeta = {};
    const res = await deliver(load());
    expect(res.status).toBe(200);
    expect(saleCalls[0].p_slugs).toEqual([piece.slug]);
    expect(pieces.get(piece.slug)?.status).toBe("sold_out");
  });

  it("Stripe の明細が読めなければ 500（黙って metadata に切り替えない）", async () => {
    lineItemsDown = true;
    const res = await deliver(load());
    expect(res.status).toBe(500);
    expect(saleCalls).toEqual([]);
    expect(mails).toEqual([]);
  });
});
