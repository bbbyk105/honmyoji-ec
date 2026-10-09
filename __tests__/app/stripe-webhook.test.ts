/**
 * @jest-environment node
 */

// Stripe の Webhook（app/api/stripe/webhook/route.ts）。再送に強いこと:
//   - 初めての配達で、完売と知らせ（お店・お客さま）を一度ずつ出す
//   - 知らせまで済んだ注文の再送では、何もしない
//   - 途中で落ちた配達の再送では、完売をやり直し、送っていないメールだけ送る
//   - 同じ配達が同時に届いても、知らせを出すのは一方だけ（もう一方は 503 であとで送り直してもらう）
// Stripe とメールは差し替え、DB（PostgREST）は Map で持つ偽物の fetch。

export {};

jest.mock("server-only", () => ({}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

const mails: { kind: string; subject: string }[] = [];
let failCustomerOnce = false;
jest.mock("@/lib/mail", () => ({
  notifyStore: jest.fn(async (mail: { subject: string }) => {
    mails.push({ kind: "store", subject: mail.subject });
  }),
  sendToCustomer: jest.fn(async (_to: string, mail: { subject: string }) => {
    if (failCustomerOnce) {
      failCustomerOnce = false;
      throw new Error("Resend 503");
    }
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

/** 明細の作品（SKU と slug）。空にすると、明細から作品を引けない行になる */
let lineMeta: Record<string, string> = { slug: piece.slug, sku: piece.sku };

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
              price: { product: { metadata: lineMeta, name: piece.name } },
            },
          ],
        }),
      },
    },
  }),
}));

// ---- 偽物の DB（orders と piece_overrides） ----------------------------------------------
type Order = {
  id: number;
  stripe_session: string;
  notified_at: string | null;
  notifying_at: string | null;
  mails_sent: string[];
};
let orders: Order[];
let pieces: Map<string, { status: string | null; sold_session: string | null }>;
let failNextSoldWrite: boolean;

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
        orders.push({
          id: orders.length + 1,
          stripe_session: body.stripe_session,
          notified_at: null,
          notifying_at: null,
          mails_sent: [],
        });
      }
      return json([], 201);
    }
    if (method === "GET") {
      const s = url.searchParams.get("stripe_session")?.replace(/^eq\./, "");
      const o = orders.find((x) => x.stripe_session === s);
      return o ? json({ id: o.id, notified_at: o.notified_at }) : json({ message: "not found" }, 406);
    }
    if (method === "PATCH") {
      const o = orders.find((x) => x.id === Number(url.searchParams.get("id")?.replace(/^eq\./, "")));
      if (!o) return json([]);
      // 印を借りる: notified_at が空で、印が無いか古いときだけ
      if (url.searchParams.get("notified_at") === "is.null") {
        const or = url.searchParams.get("or") ?? "";
        const staleBefore = /notifying_at\.lt\.([^,)]+)/.exec(or)?.[1] ?? "";
        const free = o.notifying_at === null || o.notifying_at < staleBefore;
        if (o.notified_at !== null || !free) return json([]);
        o.notifying_at = body.notifying_at;
        return json([{ id: o.id, mails_sent: o.mails_sent }]);
      }
      Object.assign(o, body);
      return json([]);
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
      for (const slug of hit) {
        const prev = pieces.get(slug)!;
        pieces.set(slug, {
          status: "sold_out",
          sold_session: "sold_session" in body ? body.sold_session : prev.sold_session,
        });
      }
      return json(hit.map((slug) => ({ slug })));
    }
    if (method === "POST") {
      const rows = body as { slug: string; sold_session?: string | null }[];
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
  failCustomerOnce = false;
  lineMeta = { slug: piece.slug, sku: piece.sku };
  mails.length = 0;
  global.fetch = fakeFetch as unknown as typeof fetch;
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("Stripe Webhook", () => {
  it("初めての配達: 完売にして、お店とお客さまに一通ずつ。終わったら印を返す", async () => {
    const res = await deliver(load());
    expect(res.status).toBe(200);
    expect(pieces.get(piece.slug)).toEqual({ status: "sold_out", sold_session: SESSION });
    expect(mails.map((m) => m.kind)).toEqual(["store", "customer"]);
    expect(orders[0]).toMatchObject({ notifying_at: null, mails_sent: ["store", "customer"] });
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

  it("完売の書き込みで落ちたら 500 で印を返し、再送で完売と知らせをやり直す（二重販売とは言わない）", async () => {
    const route = load();
    failNextSoldWrite = true;
    const first = await deliver(route);
    expect(first.status).toBe(500);
    expect(mails).toEqual([]);
    expect(orders[0]).toMatchObject({ notified_at: null, notifying_at: null });

    const retry = await deliver(route);
    expect(retry.status).toBe(200);
    expect(mails.map((m) => m.kind)).toEqual(["store", "customer"]);
  });

  it("お客さまへのメールで落ちたら 500。再送では、送っていないお客さまへの一通だけ送る", async () => {
    const route = load();
    failCustomerOnce = true;
    const first = await deliver(route);
    expect(first.status).toBe(500);
    expect(mails.map((m) => m.kind)).toEqual(["store"]);

    const retry = await deliver(route);
    expect(retry.status).toBe(200);
    expect(mails.map((m) => m.kind)).toEqual(["store", "customer"]);
  });

  it("前の配達が完売まで進んでから落ちた再送でも、自分の完売を二重販売と言わない", async () => {
    orders.push({ id: 1, stripe_session: SESSION, notified_at: null, notifying_at: null, mails_sent: [] });
    pieces.set(piece.slug, { status: "sold_out", sold_session: SESSION });
    const res = await deliver(load());
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

  it("別の配達がいま知らせを出していたら、送らずに 503（あとで送り直してもらう）", async () => {
    orders.push({
      id: 1,
      stripe_session: SESSION,
      notified_at: null,
      notifying_at: new Date().toISOString(),
      mails_sent: [],
    });
    const res = await deliver(load());
    expect(res.status).toBe(503);
    expect(mails).toEqual([]);
  });

  it("明細から作品を引けなくても、決済に残した作品は完売にする", async () => {
    lineMeta = {};
    const res = await deliver(load());
    expect(res.status).toBe(200);
    expect(pieces.get(piece.slug)?.status).toBe("sold_out");
  });
});
