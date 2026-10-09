/**
 * @jest-environment node
 */

// 決済の通った作品を完売にし、もう買えない状態だったもの（二重販売）を拾う（lib/mark-sold.ts）。
// DB（PostgREST）は、piece_overrides を Map で持つ偽物の fetch で置き換える。

export {};

jest.mock("server-only", () => ({}));

import { products } from "@/data/products";

type Mod = typeof import("@/lib/mark-sold");
type Db = typeof import("@/lib/supabase");

const [a, b, c] = products.map((p) => p.slug);

/** piece_overrides。status が null は「行はあるが status が空」、キーが無いのは「行が無い」。 */
type Row = { status: string | null; sold_session: string | null };
let table: Map<string, Row>;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function slugsOf(url: URL): string[] {
  const raw = url.searchParams.get("slug") ?? "";
  const m = /^in\.\((.*)\)$/.exec(raw);
  return m ? m[1].split(",").map((v) => v.replace(/^"|"$/g, "")) : [];
}

const fakeFetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = new URL(String(input));
  const method = init?.method ?? "GET";
  const slugs = slugsOf(url);
  const status = url.searchParams.getAll("status");
  const body = init?.body ? JSON.parse(String(init.body)) : null;

  if (method === "PATCH") {
    const match = (s: string | null) =>
      status.includes("not.in.(sold_out,reserved)")
        ? s !== null && s !== "sold_out" && s !== "reserved"
        : status.includes("is.null")
          ? s === null
          : status.includes("eq.reserved")
            ? s === "reserved"
            : true;
    const hit = slugs.filter((slug) => table.has(slug) && match(table.get(slug)!.status));
    for (const slug of hit) table.set(slug, { status: "sold_out", sold_session: body?.sold_session ?? null });
    return json(hit.map((slug) => ({ slug })));
  }
  if (method === "POST") {
    const rows = body as { slug: string; sold_session?: string }[];
    const inserted = rows.filter((r) => !table.has(r.slug));
    for (const r of inserted) table.set(r.slug, { status: "sold_out", sold_session: r.sold_session ?? null });
    return json(inserted.map((r) => ({ slug: r.slug })), 201);
  }
  return json(
    slugs.filter((slug) => table.has(slug)).map((slug) => ({ slug, ...table.get(slug) })),
  );
});

const row = (status: string | null, sold_session: string | null = null): Row => ({ status, sold_session });

function load(): { markSold: Mod["markSold"]; client: NonNullable<ReturnType<Db["db"]>> } {
  const saved = { ...process.env };
  process.env.SUPABASE_URL = "https://abc.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
  let mod!: Mod;
  let dbMod!: Db;
  jest.isolateModules(() => {
    dbMod = jest.requireActual<Db>("@/lib/supabase");
    mod = jest.requireActual<Mod>("@/lib/mark-sold");
  });
  process.env = saved;
  return { markSold: mod.markSold, client: dbMod.db()! };
}

beforeEach(() => {
  table = new Map();
  fakeFetch.mockClear();
  global.fetch = fakeFetch as unknown as typeof fetch;
  jest.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("markSold", () => {
  it("販売中の作品は完売にして、取り違えは無し", async () => {
    table.set(a, row("available"));
    table.set(b, row("available"));
    const { markSold, client } = load();

    expect(await markSold(client, [a, b], "now", "cs_this")).toEqual([]);
    expect(table.get(a)?.status).toBe("sold_out");
    expect(table.get(b)?.status).toBe("sold_out");
  });

  it("決済の前にもう完売だった作品を拾う（同時に来た二つ目の Webhook はここに来る）", async () => {
    table.set(a, row("available"));
    table.set(b, row("sold_out", "cs_other"));
    const { markSold, client } = load();

    expect(await markSold(client, [a, b], "now", "cs_this")).toEqual([{ slug: b, status: "sold_out" }]);
  });

  it("取り置き中だった作品は取り違えとして拾い、お金が入ったので完売にする", async () => {
    table.set(c, row("reserved"));
    const { markSold, client } = load();

    expect(await markSold(client, [c], "now", "cs_this")).toEqual([{ slug: c, status: "reserved" }]);
    expect(table.get(c)?.status).toBe("sold_out");
  });

  it("行が無い作品は作って完売に（コード側が Coming soon なら取り違えではない）", async () => {
    const { markSold, client } = load();

    expect(await markSold(client, [a], "now", "cs_this")).toEqual([]);
    expect(table.get(a)?.status).toBe("sold_out");
  });

  it("status が空の行もコード側の状態として扱い、完売にする", async () => {
    table.set(b, row(null));
    const { markSold, client } = load();

    expect(await markSold(client, [b], "now", "cs_this")).toEqual([]);
    expect(table.get(b)?.status).toBe("sold_out");
  });

  it("完売にした決済を sold_session に残す", async () => {
    table.set(a, row("available"));
    const { markSold, client } = load();
    await markSold(client, [a], "now", "cs_this");
    expect(table.get(a)).toEqual({ status: "sold_out", sold_session: "cs_this" });
  });

  it("再送で、前の配達で自分が完売にした作品は取り違えに数えない（何度呼んでも同じ）", async () => {
    table.set(a, row("available"));
    table.set(b, row("available"));
    const { markSold, client } = load();
    expect(await markSold(client, [a, b], "now", "cs_this")).toEqual([]);
    // 前の配達が完売まで進んでから落ち、Stripe が再送してきた
    expect(await markSold(client, [a, b], "later", "cs_this")).toEqual([]);
    // 別の決済が同じ作品を払っていたら、それは取り違え
    expect(await markSold(client, [a], "later", "cs_other")).toEqual([{ slug: a, status: "sold_out" }]);
  });

  it("DB に届かなければ投げる（Webhook は 500 で再送させる）", async () => {
    global.fetch = jest.fn(async () => json({ message: "down" }, 503)) as unknown as typeof fetch;
    const { markSold, client } = load();

    await expect(markSold(client, [a], "now", "cs_this")).rejects.toBeTruthy();
  });
});
