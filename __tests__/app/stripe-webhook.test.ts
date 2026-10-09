/**
 * @jest-environment node
 */

// Stripe の Webhook（app/api/stripe/webhook/route.ts）の流れ。売れたことの記録（record_sale）の中身は
// supabase/tests/record-sale.test.mjs が本物の Postgres（PGlite）で確かめる。ここでは:
//   - 完売にするのは Stripe の明細を待たずに（決済に残した SKU と slug から）
//   - 初めての配達で、お客さまとお店に一通ずつ（お店へのメールに、確認メールがどうなったかを書く）
//   - 知らせまで済んだ注文の再送では何もしない（Stripe の API も呼ばない）
//   - 途中で落ちたら 500。再送では送っていないメールだけ送る
//   - お客さまの宛先が断られたら「送れない」と記録して先へ進む。設定の誤り（お店にも届かない）なら 500
//   - 別の配達が知らせを出していたら 503
// Stripe とメールは差し替え、DB（PostgREST）は偽物の fetch。

export {};

jest.mock("server-only", () => ({}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

type SentMail = { kind: string; subject: string; text: string; key?: string };
const mails: SentMail[] = [];
/** 次の一通を、この状態コードで断らせる（0 はタイムアウト = 一時的） */
const refuse: { customer: number[]; store: number[] } = { customer: [], store: [] };
class FakeMailError extends Error {
  constructor(readonly status: number) {
    super(`Resend ${status}`);
  }
}
function maybeRefuse(kind: "customer" | "store") {
  const status = refuse[kind].shift();
  if (status === undefined) return;
  throw status === 0 ? new Error("TimeoutError") : new FakeMailError(status);
}
jest.mock("@/lib/mail", () => ({
  notifyStore: jest.fn(async (mail: { subject: string; text: string; idempotencyKey?: string }) => {
    maybeRefuse("store");
    mails.push({ kind: "store", subject: mail.subject, text: mail.text, key: mail.idempotencyKey });
  }),
  sendToCustomer: jest.fn(async (_to: string, mail: { subject: string; text: string; idempotencyKey?: string }) => {
    maybeRefuse("customer");
    mails.push({ kind: "customer", subject: mail.subject, text: mail.text, key: mail.idempotencyKey });
  }),
  isPermanentMailError: (error: unknown) =>
    error instanceof FakeMailError && error.status >= 400 && error.status < 500 && error.status !== 429,
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
  metadata: { skus: piece.sku, slugs: piece.slug, lang: "en" } as Record<string, string>,
  customer_details: { name: "Jane", email: "jane@example.com", phone: null },
  collected_information: null,
};

/** 明細の作品（SKU と slug）。空にすると、明細から作品を引けない行になる */
let lineMeta: Record<string, string> = { slug: piece.slug, sku: piece.sku };
let lineItemsDown = false;
let lineItemCalls = 0;

jest.mock("@/lib/stripe", () => ({
  webCrypto: {},
  stripe: () => ({
    webhooks: {
      constructEventAsync: async () => ({ type: "checkout.session.completed", data: { object: session } }),
    },
    checkout: {
      sessions: {
        listLineItems: async () => {
          lineItemCalls += 1;
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
  return { sale_order_id: o.id, sale_notified_at: o.notified_at, sale_clashes: o.clashes };
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
  refuse.customer = [];
  refuse.store = [];
  session.metadata = { skus: piece.sku, slugs: piece.slug, lang: "en" };
  lineMeta = { slug: piece.slug, sku: piece.sku };
  lineItemsDown = false;
  lineItemCalls = 0;
  saleCalls = [];
  mails.length = 0;
  global.fetch = fakeFetch as unknown as typeof fetch;
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("Stripe Webhook", () => {
  it("初めての配達: 完売にし、お客さま、お店の順に一通ずつ。終わったら印を返す", async () => {
    const res = await deliver(load());
    expect(res.status).toBe(200);
    expect(pieces.get(piece.slug)).toEqual({ status: "sold_out", sold_session: SESSION });
    expect(mails.map((m) => m.kind)).toEqual(["customer", "store"]);
    expect(mails[1].text).toContain("確認メール: 送りました");
    expect(orders[0]).toMatchObject({ notifying_at: null });
    expect([...orders[0].mails_sent].sort()).toEqual(["customer", "store"]);
    expect(orders[0].notified_at).not.toBeNull();
  });

  it("メールには一通ごとの Idempotency-Key を付ける（送れたのに失敗に見えても二通目にならない）", async () => {
    await deliver(load());
    expect(mails.map((m) => m.key)).toEqual([`${SESSION}:customer`, `${SESSION}:store`]);
  });

  it("知らせまで済んだ注文の再送: メールを二度送らず、Stripe の明細も読まない", async () => {
    const route = load();
    await deliver(route);
    mails.length = 0;
    lineItemCalls = 0;
    const res = await deliver(route);
    expect(res.status).toBe(200);
    expect(mails).toEqual([]);
    expect(lineItemCalls).toBe(0);
  });

  it("記録で落ちたら 500。再送で記録と知らせをやり直す", async () => {
    const route = load();
    failNextSale = true;
    expect((await deliver(route)).status).toBe(500);
    expect(mails).toEqual([]);
    expect((await deliver(route)).status).toBe(200);
    expect(mails.map((m) => m.kind)).toEqual(["customer", "store"]);
  });

  it("Stripe の明細が読めなくても、先に完売にしてから 500（再送でメールを送る）", async () => {
    const route = load();
    lineItemsDown = true;
    expect((await deliver(route)).status).toBe(500);
    expect(pieces.get(piece.slug)).toEqual({ status: "sold_out", sold_session: SESSION });
    expect(mails).toEqual([]);

    lineItemsDown = false;
    expect((await deliver(route)).status).toBe(200);
    expect(mails.map((m) => m.kind)).toEqual(["customer", "store"]);
  });

  it("決済の間に slug が変わっていても、SKU で引いて完売にする", async () => {
    session.metadata = { skus: piece.sku, slugs: "old-temporary-name", lang: "en" };
    expect((await deliver(load())).status).toBe(200);
    expect(saleCalls[0].p_slugs).toEqual([piece.slug]);
    expect(saleCalls[0].p_order_slugs).toEqual([piece.slug, "old-temporary-name"]);
    expect(pieces.get(piece.slug)?.status).toBe("sold_out");
  });

  it("お客さまへのメールが一時的に落ちたら 500 で印を返す。再送で、お客さまとお店に送る", async () => {
    const route = load();
    refuse.customer = [0];
    expect((await deliver(route)).status).toBe(500);
    expect(mails).toEqual([]);
    expect(orders[0].notifying_at).toBeNull();

    expect((await deliver(route)).status).toBe(200);
    expect(mails.map((m) => m.kind)).toEqual(["customer", "store"]);
  });

  it("お店へのメールが落ちたら 500。再送では、お客さまに二通目を送らない", async () => {
    const route = load();
    refuse.store = [503];
    expect((await deliver(route)).status).toBe(500);
    expect(mails.map((m) => m.kind)).toEqual(["customer"]);

    expect((await deliver(route)).status).toBe(200);
    expect(mails.map((m) => m.kind)).toEqual(["customer", "store"]);
  });

  it("お客さまの宛先が断られた（お店には届く）: 「送れない」と記録して 200。お店へのメールにそう書く", async () => {
    refuse.customer = [422];
    const res = await deliver(load());
    expect(res.status).toBe(200);
    expect(mails.map((m) => m.kind)).toEqual(["store"]);
    expect(mails[0].text).toContain("確認メール: 送れませんでした");
    expect([...orders[0].mails_sent].sort()).toEqual(["customer:failed", "store"]);
    expect(orders[0].notified_at).not.toBeNull();
  });

  it("鍵や送り元の設定の誤り（お店にも届かない）なら、お客さまの分も「送れない」にせず 500", async () => {
    const route = load();
    refuse.customer = [403];
    refuse.store = [403];
    expect((await deliver(route)).status).toBe(500);
    expect(orders[0].mails_sent).toEqual([]);

    // 設定を直したあとの再送で、両方届く
    expect((await deliver(route)).status).toBe(200);
    expect(mails.map((m) => m.kind)).toEqual(["customer", "store"]);
  });

  it("二重販売なら、お客さまには送らず、お店に注文と要確認を送る", async () => {
    pieces.set(piece.slug, { status: "sold_out", sold_session: "cs_live_other" });
    const res = await deliver(load());
    expect(res.status).toBe(200);
    expect(mails.map((m) => m.kind)).toEqual(["store", "store"]);
    expect(mails[0].text).toContain("確認メール: 送っていません");
    expect(mails[1].subject).toContain("要確認");
  });

  it("明細の作品をカタログから引けなかったら、お店へのメールに「完売にできていません」と書く", async () => {
    lineMeta = {};
    session.metadata = { slugs: "old-temporary-name", lang: "en" };
    const res = await deliver(load());
    expect(res.status).toBe(200);
    expect(saleCalls[0].p_slugs).toEqual([]);
    expect(mails.find((m) => m.kind === "store")?.text).toContain("完売にできていません");
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
});
