/**
 * @jest-environment node
 */

// Stripe の Webhook（app/api/stripe/webhook/route.ts）。再送に強いこと:
//   - 初めての配達で、完売と知らせ（お店・お客さま）を一度だけ出す
//   - 知らせまで済んだ注文の再送では、何もしない
//   - 前の配達が完売まで進んでから落ちた再送では、知らせを出す（二重販売とは言わない）
//   - 同じ配達が同時に届いても、知らせは一回
// Stripe とメールは差し替え、DB（PostgREST）は Map で持つ偽物の fetch。

export {};

jest.mock("server-only", () => ({}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

const mails: { kind: string; subject: string }[] = [];
jest.mock("@/lib/mail", () => ({
  notifyStoreQuietly: jest.fn(async (mail: { subject: string }) => {
    mails.push({ kind: "store", subject: mail.subject });
  }),
  sendToCustomerQuietly: jest.fn(async (_to: string, mail: { subject: string }) => {
    mails.push({ kind: "customer", subject: mail.subject });
  }),
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

jest.mock("@/lib/stripe", () => ({
  webCrypto: {},
  stripe: () => ({
    webhooks: {
      constructEventAsync: async () => ({ type: "checkout.session.completed", data: { object: session } }),
    },
    checkout: {
      sessions: {
        listLineItems: async () => ({
          data: [
            {
              amount_total: 14500,
              quantity: 1,
              description: `${piece.name} — ${piece.kanji}`,
              price: { product: { metadata: { slug: piece.slug, sku: piece.sku }, name: piece.name } },
            },
          ],
        }),
      },
    },
  }),
}));

// ---- 偽物の DB（orders と piece_overrides） ----------------------------------------------
type Order = { id: number; stripe_session: string; notified_at: string | null };
let orders: Order[];
let pieces: Map<string, { status: string | null; sold_session: string | null }>;
let failNextSoldWrite: boolean;
let claimLost: boolean;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function inList(url: URL, key: string): string[] {
  const m = /^in\.\((.*)\)$/.exec(url.searchParams.get(key) ?? "");
  return m ? m[1].split(",").map((v) => v.replace(/^"|"$/g, "")) : [];
}

const fakeFetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = new URL(String(input));
  const method = init?.method ?? "GET";
  const body = init?.body ? JSON.parse(String(init.body)) : null;
  const table = url.pathname.split("/").pop();

  if (table === "orders") {
    if (method === "POST") {
      if (!orders.some((o) => o.stripe_session === body.stripe_session)) {
        orders.push({ id: orders.length + 1, stripe_session: body.stripe_session, notified_at: null });
      }
      return json([], 201);
    }
    if (method === "GET") {
      const s = url.searchParams.get("stripe_session")?.replace(/^eq\./, "");
      const o = orders.find((x) => x.stripe_session === s);
      return o ? json({ id: o.id, notified_at: o.notified_at }) : json({ message: "not found" }, 406);
    }
    if (method === "PATCH") {
      const id = Number(url.searchParams.get("id")?.replace(/^eq\./, ""));
      const o = orders.find((x) => x.id === id);
      if (!o || o.notified_at !== null || claimLost) return json([]);
      o.notified_at = body.notified_at;
      return json([{ id }]);
    }
  }

  if (table === "piece_overrides") {
    const slugs = inList(url, "slug");
    const status = url.searchParams.getAll("status");
    if (method === "PATCH") {
      if (failNextSoldWrite) {
        failNextSoldWrite = false;
        return json({ message: "down" }, 503);
      }
      const match = (s: string | null) =>
        status.includes("not.in.(sold_out,reserved)")
          ? s !== null && s !== "sold_out" && s !== "reserved"
          : status.includes("is.null")
            ? s === null
            : status.includes("eq.reserved")
              ? s === "reserved"
              : true;
      const hit = slugs.filter((slug) => pieces.has(slug) && match(pieces.get(slug)!.status));
      for (const slug of hit) pieces.set(slug, { status: "sold_out", sold_session: body.sold_session ?? null });
      return json(hit.map((slug) => ({ slug })));
    }
    if (method === "POST") {
      const rows = body as { slug: string; sold_session?: string }[];
      const inserted = rows.filter((r) => !pieces.has(r.slug));
      for (const r of inserted) pieces.set(r.slug, { status: "sold_out", sold_session: r.sold_session ?? null });
      return json(inserted.map((r) => ({ slug: r.slug })), 201);
    }
    return json(slugs.filter((slug) => pieces.has(slug)).map((slug) => ({ slug, ...pieces.get(slug) })));
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
  failNextSoldWrite = false;
  claimLost = false;
  mails.length = 0;
  global.fetch = fakeFetch as unknown as typeof fetch;
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("Stripe Webhook", () => {
  it("初めての配達: 完売にして、お店とお客さまに一通ずつ（値段は明細から）", async () => {
    const res = await deliver(load());
    expect(res.status).toBe(200);
    expect(pieces.get(piece.slug)).toEqual({ status: "sold_out", sold_session: SESSION });
    expect(mails.map((m) => m.kind)).toEqual(["store", "customer"]);
    expect(orders[0].notified_at).not.toBeNull();
  });

  it("知らせまで済んだ注文の再送: 何もしない（メールを二度送らない）", async () => {
    const route = load();
    await deliver(route);
    mails.length = 0;
    const res = await deliver(route);
    expect(res.status).toBe(200);
    expect(mails).toEqual([]);
  });

  it("完売の書き込みで落ちたら 500。再送で完売と知らせをやり直す（二重販売とは言わない）", async () => {
    const route = load();
    failNextSoldWrite = true;
    const first = await deliver(route);
    expect(first.status).toBe(500);
    expect(mails).toEqual([]);
    expect(orders[0].notified_at).toBeNull();

    const retry = await deliver(route);
    expect(retry.status).toBe(200);
    expect(mails.map((m) => m.kind)).toEqual(["store", "customer"]);
    expect(mails.some((m) => m.subject.includes("要確認"))).toBe(false);
  });

  it("前の配達が完売まで進んでから落ちた再送でも、自分の完売を二重販売と言わない", async () => {
    const route = load();
    // 前の配達で、注文の行と完売（この決済）までは済んでいた
    orders.push({ id: 1, stripe_session: SESSION, notified_at: null });
    pieces.set(piece.slug, { status: "sold_out", sold_session: SESSION });
    const res = await deliver(route);
    expect(res.status).toBe(200);
    expect(mails.map((m) => m.kind)).toEqual(["store", "customer"]);
  });

  it("別の決済が先に払っていたら、お客さまには送らず、お店に要確認を送る", async () => {
    pieces.set(piece.slug, { status: "sold_out", sold_session: "cs_live_other" });
    const res = await deliver(load());
    expect(res.status).toBe(200);
    expect(mails.map((m) => m.kind)).toEqual(["store", "store"]);
    expect(mails[1].subject).toContain("要確認");
  });

  it("同じ配達が同時に届き、知らせる権利を取れなかった方は送らない", async () => {
    claimLost = true;
    const res = await deliver(load());
    expect(res.status).toBe(200);
    expect(mails).toEqual([]);
  });
});
