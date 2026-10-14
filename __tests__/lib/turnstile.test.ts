/**
 * @jest-environment node
 */

// 公開フォームの「人が送っているか」の照合（verifyTurnstile）。断るのは印が無い・偽物・
// 使い回し・別のフォームの印のときだけ。こちら側の都合（秘密が無い・Cloudflare に届かない・
// 設定の誤り）で確かめられないときは通す。

export {};

jest.mock("server-only", () => ({}));

type Mod = typeof import("@/lib/turnstile");

function load(): Mod {
  let mod!: Mod;
  jest.isolateModules(() => {
    mod = jest.requireActual<Mod>("@/lib/turnstile");
  });
  return mod;
}

/** process.env は afterEach で差し替えるので、その時々のものを触る */
const env = () => process.env as Record<string, string | undefined>;
const saved = { ...process.env };

const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>();
const reply = (body: unknown, status = 200) =>
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }));
const sentBody = () => JSON.parse(String(fetchMock.mock.calls[0][1]?.body));

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  env().TURNSTILE_SECRET_KEY = "real-secret";
  env().NODE_ENV = "production";
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  process.env = { ...saved };
  jest.restoreAllMocks();
});

describe("verifyTurnstile", () => {
  it("Cloudflare が通した印は通す。秘密・印・IP を送る", async () => {
    reply({ success: true, action: "contact" });
    const result = await load().verifyTurnstile("tok", { action: "contact", ip: "203.0.113.5" });

    expect(result).toEqual({ ok: true });
    expect(fetchMock.mock.calls[0][0]).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(sentBody()).toEqual({ secret: "real-secret", response: "tok", remoteip: "203.0.113.5" });
  });

  it("印が無ければ Cloudflare に聞かずに断る", async () => {
    const result = await load().verifyTurnstile("", { action: "contact" });

    expect(result).toEqual({ ok: false, reason: "missing-token" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("長すぎる印は Cloudflare に聞かずに断る", async () => {
    const result = await load().verifyTurnstile("x".repeat(2049), { action: "contact" });

    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("偽物・使い回しの印は断る", async () => {
    reply({ success: false, "error-codes": ["invalid-input-response"] });
    expect(await load().verifyTurnstile("forged", { action: "contact" })).toEqual({
      ok: false,
      reason: "invalid-input-response",
    });

    reply({ success: false, "error-codes": ["timeout-or-duplicate"] });
    expect((await load().verifyTurnstile("used", { action: "contact" })).ok).toBe(false);
  });

  it("別のフォームの印は断る", async () => {
    reply({ success: true, action: "subscribe" });
    expect(await load().verifyTurnstile("tok", { action: "contact" })).toEqual({
      ok: false,
      reason: "action-mismatch",
    });
  });

  it("IP が分からないときは remoteip を送らない", async () => {
    reply({ success: true, action: "contact" });
    await load().verifyTurnstile("tok", { action: "contact", ip: "unknown" });

    expect(sentBody()).not.toHaveProperty("remoteip");
  });

  it("こちら側の都合で確かめられないときは通す（お問い合わせを落とさない）", async () => {
    // 秘密の設定の誤り
    reply({ success: false, "error-codes": ["invalid-input-secret"] });
    expect((await load().verifyTurnstile("tok", { action: "contact" })).ok).toBe(true);

    // Cloudflare が 5xx
    reply({}, 503);
    expect((await load().verifyTurnstile("tok", { action: "contact" })).ok).toBe(true);

    // 届かない
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    expect((await load().verifyTurnstile("tok", { action: "contact" })).ok).toBe(true);
  });

  it("本番で秘密が入っていなければ、確かめずに通してログに出す", async () => {
    delete env().TURNSTILE_SECRET_KEY;
    const result = await load().verifyTurnstile("tok", { action: "contact" });

    expect(result).toEqual({ ok: true, skipped: "no-secret" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("TURNSTILE_SECRET_KEY"));
  });

  it("手元（本番以外）では、.env に本物の秘密があっても試験用の秘密で確かめる", async () => {
    // 手元のフォームは試験用のサイトキーの印を出すので、本物の秘密と組むと必ず断られる
    env().NODE_ENV = "development";
    reply({ success: true });
    const result = await load().verifyTurnstile("XXXX.DUMMY.TOKEN.XXXX", { action: "contact" });

    expect(result).toEqual({ ok: true });
    expect(sentBody().secret).toBe("1x0000000000000000000000000000000AA");
  });
});
