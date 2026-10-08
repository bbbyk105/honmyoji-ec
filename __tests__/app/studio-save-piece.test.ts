/**
 * @jest-environment node
 */

// 管理画面の作品の保存（savePiece）。開いたまま置いていた画面から保存して、その間に
// Webhook が付けた「完売」を「販売中」に戻さないこと（2026-10-08 の監査）。

// import が無いとファイルがモジュールにならず、他のテストの load() と名前がぶつかる
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

/** DB の piece_overrides に今入っているステータス（行が無ければ undefined）。 */
function database(current: string | null | undefined) {
  const calls: { method: string; url: string; body?: string }[] = [];
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    calls.push({ method, url: String(input), body: typeof init?.body === "string" ? init.body : undefined });
    if (method === "GET") {
      const rows = current === undefined ? [] : [{ status: current }];
      return new Response(JSON.stringify(rows), { status: 200, headers: { "content-type": "application/json" } });
    }
    return new Response(null, { status: 201 });
  }) as unknown as typeof fetch;
  return calls;
}

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  fd.set("slug", "tokiwa-evergreen");
  fd.set("price_aud", "240");
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("savePiece", () => {
  it("ステータスを選び直していなければ、status の列を送らない（Webhook の完売に触れない）", async () => {
    const calls = database("sold_out");
    const { savePiece } = load();

    const result = await savePiece({}, form({ status: "available", status_was: "available" }));

    expect(result.error).toBeUndefined();
    expect(calls.map((c) => c.method)).toEqual(["POST"]);
    const row = JSON.parse(calls[0].body!);
    expect(row).not.toHaveProperty("status");
    expect(row.price_aud).toBe(240);
  });

  it("選び直していて、開いたときから DB が変わっていなければ書く", async () => {
    const calls = database("available");
    const { savePiece } = load();

    const result = await savePiece({}, form({ status: "reserved", status_was: "available" }));

    expect(result.error).toBeUndefined();
    expect(calls.map((c) => c.method)).toEqual(["GET", "POST"]);
    expect(JSON.parse(calls[1].body!).status).toBe("reserved");
  });

  it("行がまだ無く「コード側のまま」から選び直したときも書ける", async () => {
    const calls = database(undefined);
    const { savePiece } = load();

    const result = await savePiece({}, form({ status: "available", status_was: "" }));

    expect(result.error).toBeUndefined();
    expect(JSON.parse(calls[1].body!).status).toBe("available");
  });

  it("開いたあとで DB のステータスが変わっていたら、書かずに再読み込みを頼む", async () => {
    const calls = database("sold_out");
    const { savePiece } = load();

    const result = await savePiece({}, form({ status: "reserved", status_was: "available" }));

    expect(result.error).toMatch(/再読み込み/);
    expect(calls.map((c) => c.method)).toEqual(["GET"]);
  });
});
