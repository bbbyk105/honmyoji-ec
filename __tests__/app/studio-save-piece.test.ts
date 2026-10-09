/**
 * @jest-environment node
 */

// 管理画面の保存（savePiece・setPiecesStatus）。開いたまま置いていた画面から保存して、その間に
// Webhook が付けた「完売」を「販売中」に戻さないこと。読んでから書くまでの間に完売にされても
// 上書きしないこと（書き込みそのものに条件を付ける）。

export {};

jest.mock("server-only", () => ({}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/studio-session", () => ({ requireSession: jest.fn(async () => {}) }));
jest.mock("@/lib/studio-notify", () => ({ notifyStudio: jest.fn() }));

type Actions = typeof import("@/app/studio/actions");

function load(): Actions {
  const saved = { ...process.env };
  process.env.SUPABASE_URL = "https://abc.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
  let mod!: Actions;
  jest.isolateModules(() => {
    mod = jest.requireActual<Actions>("@/app/studio/actions");
  });
  process.env = saved;
  return mod;
}

// ---- 偽物の piece_overrides（slug → status。null は「行はあるが status が空」） ----------------
let table: Map<string, string | null>;
let calls: { method: string; body?: unknown }[];
/** 読んだ直後に別の誰か（Webhook）が書く。読み（GET）の次に一度だけ走る */
let afterRead: (() => void) | null;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function slugsOf(url: URL): string[] {
  const raw = url.searchParams.get("slug") ?? "";
  if (raw.startsWith("eq.")) return [raw.slice(3)];
  const m = /^in\.\((.*)\)$/.exec(raw);
  return m ? m[1].split(",").map((v) => v.replace(/^"|"$/g, "")) : [];
}

function statusMatches(url: URL, value: string | null): boolean {
  const filter = url.searchParams.get("status");
  if (filter === null) return true;
  if (filter === "is.null") return value === null;
  if (filter.startsWith("eq.")) return value === filter.slice(3);
  return true;
}

beforeEach(() => {
  table = new Map();
  calls = [];
  afterRead = null;
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, body });
    const slugs = slugsOf(url);

    if (method === "GET") {
      const rows = slugs.filter((slug) => table.has(slug)).map((slug) => ({ slug, status: table.get(slug) }));
      const response = json(rows);
      afterRead?.();
      afterRead = null;
      return response;
    }
    if (method === "PATCH") {
      const hit = slugs.filter((slug) => table.has(slug) && statusMatches(url, table.get(slug) ?? null));
      const next = (body as { status?: string }).status;
      for (const slug of hit) table.set(slug, next ?? table.get(slug) ?? null);
      return json(hit.map((slug) => ({ slug })));
    }
    if (method === "DELETE") {
      // 完売・取り置きは消さない条件（or=(status.is.null,status.not.in.(sold_out,reserved))）
      const protect = (url.searchParams.get("or") ?? "").includes("not.in.(sold_out,reserved)");
      for (const slug of slugs) {
        const value = table.get(slug) ?? null;
        if (table.has(slug) && !(protect && (value === "sold_out" || value === "reserved"))) table.delete(slug);
      }
      return json([]);
    }
    if (method === "POST") {
      const rows = (Array.isArray(body) ? body : [body]) as { slug: string; status?: string }[];
      const ignore = new Headers(init?.headers).get("prefer")?.includes("ignore-duplicates");
      const out: { slug: string }[] = [];
      for (const r of rows) {
        if (table.has(r.slug) && ignore) continue;
        table.set(r.slug, r.status ?? table.get(r.slug) ?? null);
        out.push({ slug: r.slug });
      }
      return json(out, 201);
    }
    return json([]);
  }) as unknown as typeof fetch;
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  fd.set("slug", "tokiwa-evergreen");
  fd.set("price_aud", "240");
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("savePiece", () => {
  it("ステータスを選び直していなければ、status の列を送らない（Webhook の完売に触れない）", async () => {
    table.set("tokiwa-evergreen", "sold_out");
    const { savePiece } = load();

    const result = await savePiece({}, form({ status: "available", status_was: "available" }));

    expect(result.error).toBeUndefined();
    expect(calls.map((c) => c.method)).toEqual(["POST"]);
    expect(calls[0].body).not.toHaveProperty("status");
    expect(table.get("tokiwa-evergreen")).toBe("sold_out");
  });

  it("選び直していて、開いたときから DB が変わっていなければ、その状態のままなら書く", async () => {
    table.set("tokiwa-evergreen", "available");
    const { savePiece } = load();

    const result = await savePiece({}, form({ status: "reserved", status_was: "available" }));

    expect(result.error).toBeUndefined();
    expect(calls.map((c) => c.method)).toEqual(["GET", "PATCH"]);
    expect(table.get("tokiwa-evergreen")).toBe("reserved");
  });

  it("行がまだ無く「コード側のまま」から選び直したときは、無いままなら作る", async () => {
    const { savePiece } = load();

    const result = await savePiece({}, form({ status: "available", status_was: "" }));

    expect(result.error).toBeUndefined();
    expect(table.get("tokiwa-evergreen")).toBe("available");
  });

  it("開いたあとで DB のステータスが変わっていたら、書かずに再読み込みを頼む", async () => {
    table.set("tokiwa-evergreen", "sold_out");
    const { savePiece } = load();

    const result = await savePiece({}, form({ status: "reserved", status_was: "available" }));

    expect(result.error).toMatch(/再読み込み/);
    expect(calls.map((c) => c.method)).toEqual(["GET"]);
  });

  it("読んでから書くまでの間に Webhook が完売にしても、上書きしない", async () => {
    table.set("tokiwa-evergreen", "available");
    afterRead = () => table.set("tokiwa-evergreen", "sold_out");
    const { savePiece } = load();

    const result = await savePiece({}, form({ status: "reserved", status_was: "available" }));

    expect(result.error).toMatch(/再読み込み/);
    expect(table.get("tokiwa-evergreen")).toBe("sold_out");
  });
});

describe("setPiecesStatus", () => {
  it("開いたときと DB が同じなら、その状態のままなら書く", async () => {
    table.set("tokiwa-evergreen", "available");
    const { setPiecesStatus } = load();

    const result = await setPiecesStatus(["tokiwa-evergreen"], "reserved", { "tokiwa-evergreen": "available" });

    expect(result).toEqual({ ok: true, count: 1 });
    expect(table.get("tokiwa-evergreen")).toBe("reserved");
  });

  it("開いたあとで Webhook が完売にしていたら書かない（売れた一点物を戻さない）", async () => {
    table.set("tokiwa-evergreen", "sold_out");
    const { setPiecesStatus } = load();

    const result = await setPiecesStatus(["tokiwa-evergreen"], "available", { "tokiwa-evergreen": "available" });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/再読み込み/);
    expect(calls.map((c) => c.method)).toEqual(["GET"]);
  });

  it("読んでから書くまでの間に Webhook が完売にしても、上書きしない（ほかの作品は書く）", async () => {
    table.set("tokiwa-evergreen", "available");
    table.set("akane-madder", "available");
    afterRead = () => table.set("tokiwa-evergreen", "sold_out");
    const { setPiecesStatus } = load();

    const result = await setPiecesStatus(["tokiwa-evergreen", "akane-madder"], "reserved", {
      "tokiwa-evergreen": "available",
      "akane-madder": "available",
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/ほかの 1 点は変えました/);
    expect(table.get("tokiwa-evergreen")).toBe("sold_out");
    expect(table.get("akane-madder")).toBe("reserved");
  });

  it("行が無ければコード側の状態と比べて、無いままなら作る", async () => {
    const { setPiecesStatus } = load();

    const result = await setPiecesStatus(["tokiwa-evergreen"], "available", { "tokiwa-evergreen": "coming_soon" });

    expect(result).toEqual({ ok: true, count: 1 });
    expect(table.get("tokiwa-evergreen")).toBe("available");
  });

  it("開いたときの状態が無い作品は書かない（確かめようがない）", async () => {
    const { setPiecesStatus } = load();
    const result = await setPiecesStatus(["tokiwa-evergreen"], "available", {});
    expect(result.ok).toBe(false);
  });
});

describe("resetPiece", () => {
  function resetForm() {
    const fd = new FormData();
    fd.set("slug", "tokiwa-evergreen");
    return fd;
  }

  it("ふつうの上書きは行ごと消して、コード側の値に戻す", async () => {
    table.set("tokiwa-evergreen", "available");
    const { resetPiece } = load();
    await resetPiece(resetForm());
    expect(table.has("tokiwa-evergreen")).toBe(false);
  });

  it("完売の作品は行を消さない（Webhook の完売を消して販売中に戻さない）", async () => {
    table.set("tokiwa-evergreen", "sold_out");
    const { resetPiece } = load();
    await resetPiece(resetForm());
    expect(table.get("tokiwa-evergreen")).toBe("sold_out");
  });
});
