/**
 * @jest-environment node
 */

// ログインの回数制限（lib/studio-guard.ts）。2026-10-08 の監査で見つかった二つを止めておく:
//   - Cloudflare では x-forwarded-for の先頭を客が書けるので、それを鍵にすると IP を変えて
//     すり抜けられる
//   - 数えてから記録していたので、同時に送ると上限を超えて試せた（いまは記録してから数える）

// import が無いとファイルがモジュールにならず、他のテストの load() と名前がぶつかる
export {};

jest.mock("server-only", () => ({}));

type Guard = typeof import("@/lib/studio-guard");

/** 環境変数を入れてから読み込む（DB の有無も、メモリの受け皿も読み込みごとに新しくなる）。 */
function load(withDb: boolean): Guard {
  const saved = { ...process.env };
  if (withDb) {
    process.env.SUPABASE_URL = "https://abc.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
  } else {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
  let mod!: Guard;
  jest.isolateModules(() => {
    mod = jest.requireActual<Guard>("@/lib/studio-guard");
  });
  process.env = saved;
  return mod;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("pickClientIp", () => {
  const h = (entries: Record<string, string>) => new Headers(entries);

  it("Workers では cf-connecting-ip を使い、客が送った x-forwarded-for は見ない", () => {
    const headers = h({ "cf-connecting-ip": "203.0.113.7", "x-forwarded-for": "198.51.100.1, 203.0.113.7" });
    expect(pickIp(headers, true)).toBe("203.0.113.7");
  });

  it("Workers で cf-connecting-ip が無くても x-forwarded-for に落ちない", () => {
    expect(pickIp(h({ "x-forwarded-for": "198.51.100.1" }), true)).toBe("unknown");
  });

  it("Workers 以外では x-forwarded-for の先頭（客が送れる cf-connecting-ip は見ない）", () => {
    const headers = h({ "cf-connecting-ip": "198.51.100.9", "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(pickIp(headers, false)).toBe("203.0.113.7");
  });

  it("IP は丸めずに返す（通知に実際のアドレスを残す）", () => {
    expect(pickIp(h({ "cf-connecting-ip": "2001:db8:1234:5678:aaaa::1" }), true)).toBe("2001:db8:1234:5678:aaaa::1");
  });

  it("数える鍵（limitKey）は IPv6 を /64 に丸める（/64 の中で送信元を変えてもすり抜けられない）", () => {
    const { limitKey } = load(false);
    const a = limitKey("2001:db8:1234:5678:aaaa::1");
    expect(a).toBe("2001:db8:1234:5678::/64");
    expect(limitKey("2001:0db8:1234:5678:ffff:eeee:dddd:cccc")).toBe(a);
    expect(limitKey("::ffff:203.0.113.7")).toBe("203.0.113.7");
    expect(limitKey("2001:db8::1")).toBe("2001:db8:0:0::/64");
    expect(limitKey("203.0.113.7")).toBe("203.0.113.7");
  });

  it("x-forwarded-for が無ければ x-real-ip、それも無ければ unknown", () => {
    expect(pickIp(h({ "x-real-ip": "203.0.113.7" }), false)).toBe("203.0.113.7");
    expect(pickIp(h({}), false)).toBe("unknown");
  });

  function pickIp(headers: Headers, onWorkers: boolean): string {
    return load(false).pickClientIp(headers, onWorkers);
  }
});

describe("takeAttempt（DB が無いときのメモリ）", () => {
  it("5 回目まで通し、5 回目は外したら締め出すと知らせ、6 回目は断る", async () => {
    const { takeAttempt } = load(false);
    for (let i = 1; i <= 4; i++) {
      expect(await takeAttempt("203.0.113.7")).toEqual({ allowed: true, lockoutMinutes: null });
    }
    expect(await takeAttempt("203.0.113.7")).toEqual({ allowed: true, lockoutMinutes: 15 });
    expect(await takeAttempt("203.0.113.7")).toEqual({ allowed: false, retryAfterMinutes: 15 });
    // 別の IP は巻き込まない
    expect(await takeAttempt("198.51.100.1")).toEqual({ allowed: true, lockoutMinutes: null });
  });

  it("通ったら帳消し", async () => {
    const { takeAttempt, recordSuccess } = load(false);
    for (let i = 0; i < 5; i++) await takeAttempt("203.0.113.7");
    await recordSuccess("203.0.113.7");
    expect(await takeAttempt("203.0.113.7")).toEqual({ allowed: true, lockoutMinutes: null });
  });
});

describe("takeAttempt（DB）", () => {
  /** 窓の中の失敗が `failures` 件（いま書いた分を含む）ある DB。 */
  function database(failures: number) {
    const calls: { method: string; url: string; body?: string }[] = [];
    const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      calls.push({ method, url: String(input), body: typeof init?.body === "string" ? init.body : undefined });
      if (method === "POST") return json({ id: 42 }, 201);
      if (method === "DELETE") return new Response(null, { status: 204 });
      const now = Date.now();
      return json(Array.from({ length: failures }, (_, i) => ({ at: new Date(now - (failures - i) * 1000).toISOString() })));
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    return calls;
  }

  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("数える前に失敗を一つ書く（同時に送っても、後の方が必ず先の分を数える）", async () => {
    const calls = database(1);
    const { takeAttempt } = load(true);

    expect(await takeAttempt("203.0.113.7")).toEqual({ allowed: true, lockoutMinutes: null });
    expect(calls.map((c) => c.method)).toEqual(["POST", "GET"]);
    expect(JSON.parse(calls[0].body!)).toEqual({ ip: "203.0.113.7", ok: false });
    expect(calls[1].url).toContain("ip=eq.203.0.113.7");
    expect(calls[1].url).toContain("ok=eq.false");
  });

  it("いま書いた分で上限ちょうどなら通し、外したら締め出すと知らせる", async () => {
    const calls = database(5);
    const { takeAttempt } = load(true);

    expect(await takeAttempt("203.0.113.7")).toEqual({ allowed: true, lockoutMinutes: 15 });
    expect(calls.some((c) => c.method === "DELETE")).toBe(false);
  });

  it("上限を超えたら、書いた分を消して断る", async () => {
    const calls = database(6);
    const { takeAttempt } = load(true);

    expect(await takeAttempt("203.0.113.7")).toEqual({ allowed: false, retryAfterMinutes: 15 });
    const del = calls.find((c) => c.method === "DELETE");
    expect(del?.url).toContain("id=eq.42");
  });

  it("DB に書けなければ通す（DB の不調で持ち主を締め出さない）", async () => {
    global.fetch = jest.fn(async () => json({ message: "boom" }, 500)) as unknown as typeof fetch;
    const { takeAttempt } = load(true);

    expect(await takeAttempt("203.0.113.7")).toEqual({ allowed: true, lockoutMinutes: null });
  });
});
