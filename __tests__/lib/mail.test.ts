/**
 * @jest-environment node
 */

// お客さまへの注文の確認（sendToCustomer）。返信がお店の公開アドレスに届くこと、
// 失敗したら状態コード付きで投げること（Webhook が送れないものと一時的なものを分ける）。

export {};

jest.mock("server-only", () => ({}));

type Mailer = typeof import("@/lib/mail");

/** 環境変数を入れてから読み込む（lib/mail.ts は読み込んだ時点の値を持つ）。 */
function load(env: Record<string, string | undefined>): Mailer {
  const saved = { ...process.env };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  let mod!: Mailer;
  jest.isolateModules(() => {
    mod = jest.requireActual<Mailer>("@/lib/mail");
  });
  process.env = saved;
  return mod;
}

const keys = {
  RESEND_API_KEY: "re_test",
  RESEND_FROM: "MIROKU <notify@honmyoujifuji.com>",
  NOTIFY_EMAILS: "shop@example.com",
};

const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>(
  async () => new Response("{}", { status: 200 }),
);

beforeEach(() => {
  fetchMock.mockClear();
  global.fetch = fetchMock as unknown as typeof fetch;
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("sendToCustomer", () => {
  it("お客さま一人に、お店の公開アドレスを返信先にして送る（お店の宛先は混ぜない）", async () => {
    const { sendToCustomer } = load(keys);
    await sendToCustomer("jane@example.com", { subject: "Thank you", text: "..." });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.to).toEqual(["jane@example.com"]);
    expect(body.from).toBe("MIROKU <notify@honmyoujifuji.com>");
    expect(body.reply_to).toBe("info@honmyoujifuji.com");
  });

  it("Resend が断ったら状態コード付きで投げる。4xx（429・409 を除く）はこの一通が断られた", async () => {
    const { sendToCustomer, isPermanentMailError } = load(keys);
    fetchMock.mockResolvedValueOnce(new Response("invalid to", { status: 422 }));
    const permanent = await sendToCustomer("x", { subject: "s", text: "t" }).catch((e: unknown) => e);
    expect(isPermanentMailError(permanent)).toBe(true);

    fetchMock.mockResolvedValueOnce(new Response("rate limited", { status: 429 }));
    const limited = await sendToCustomer("x", { subject: "s", text: "t" }).catch((e: unknown) => e);
    expect(isPermanentMailError(limited)).toBe(false);

    fetchMock.mockResolvedValueOnce(new Response("concurrent idempotent requests", { status: 409 }));
    const overlapped = await sendToCustomer("x", { subject: "s", text: "t" }).catch((e: unknown) => e);
    expect(isPermanentMailError(overlapped)).toBe(false);

    fetchMock.mockResolvedValueOnce(new Response("oops", { status: 503 }));
    const down = await sendToCustomer("x", { subject: "s", text: "t" }).catch((e: unknown) => e);
    expect(isPermanentMailError(down)).toBe(false);
  });

  it("鍵（idempotencyKey）を渡すと Idempotency-Key で送る。本文には混ぜない", async () => {
    const { sendToCustomer } = load(keys);
    await sendToCustomer("jane@example.com", { subject: "s", text: "t", idempotencyKey: "cs_1:customer" });
    const init = fetchMock.mock.calls[0][1];
    expect(new Headers(init?.headers).get("Idempotency-Key")).toBe("cs_1:customer");
    expect(JSON.parse(String(init?.body))).not.toHaveProperty("idempotencyKey");
  });

  it("鍵が無ければ送らない（投げない）", async () => {
    const { sendToCustomer } = load({ ...keys, RESEND_API_KEY: undefined });
    await sendToCustomer("jane@example.com", { subject: "s", text: "t" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
