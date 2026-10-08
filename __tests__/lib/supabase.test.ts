/**
 * @jest-environment node
 */

// supabase-js から postgrest-js に替えたとき（2026-10-08）に、DB へ送る URL とヘッダーが
// 変わっていないことを確かめる。jsdom には fetch と Response が無いので node で回す。

// import が無いとファイルがモジュールにならず、他のテストの load() と名前がぶつかる
export {};

jest.mock("server-only", () => ({}));

type Db = typeof import("@/lib/supabase");

/** 環境変数を入れてから読み込む（lib/supabase.ts は読み込んだ時点の値を持つ）。 */
function load(env: { url?: string; key?: string }): Db {
  const saved = { ...process.env };
  if (env.url === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = env.url;
  if (env.key === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = env.key;
  let mod!: Db;
  jest.isolateModules(() => {
    mod = jest.requireActual<Db>("@/lib/supabase");
  });
  process.env = saved;
  return mod;
}

const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>(
  async () => new Response("[]", { status: 200, headers: { "content-type": "application/json" } }),
);

beforeEach(() => {
  fetchMock.mockClear();
  global.fetch = fetchMock as unknown as typeof fetch;
  jest.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("db()", () => {
  it("鍵が無ければ null（公開ページは data/products.ts の値で立つ）", () => {
    const { db, dbEnabled } = load({});
    expect(dbEnabled).toBe(false);
    expect(db()).toBeNull();
  });

  it("PostgREST の /rest/v1 に、supabase-js と同じ apikey と Bearer を付けて送る", async () => {
    const { db } = load({ url: "https://abc.supabase.co", key: "service-key" });
    const { data, error } = await db()!.from("piece_overrides").select("*");

    expect(error).toBeNull();
    expect(data).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [input, init] = fetchMock.mock.calls[0];
    expect(String(input)).toBe("https://abc.supabase.co/rest/v1/piece_overrides?select=*");
    const headers = new Headers(init?.headers);
    expect(headers.get("apikey")).toBe("service-key");
    expect(headers.get("authorization")).toBe("Bearer service-key");
  });

  it("URL の末尾に / が付いていても同じ所へ送る", async () => {
    const { db } = load({ url: "https://abc.supabase.co/", key: "service-key" });
    await db()!.from("orders").select("*").eq("id", "o1");

    const [input] = fetchMock.mock.calls[0];
    expect(String(input)).toBe("https://abc.supabase.co/rest/v1/orders?select=*&id=eq.o1");
  });

  it("書き込みも同じヘッダーで送る", async () => {
    const { db } = load({ url: "https://abc.supabase.co", key: "service-key" });
    await db()!.from("piece_overrides").delete().eq("slug", "tokiwa-evergreen");

    const [input, init] = fetchMock.mock.calls[0];
    expect(String(input)).toBe("https://abc.supabase.co/rest/v1/piece_overrides?slug=eq.tokiwa-evergreen");
    expect(init?.method).toBe("DELETE");
    expect(new Headers(init?.headers).get("apikey")).toBe("service-key");
  });
});
