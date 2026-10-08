/**
 * @jest-environment node
 */

// お客さまへの注文の確認（sendToCustomerQuietly）。返信がお店の公開アドレスに届くこと、
// 失敗しても投げないこと（Webhook を止めない）。

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

describe("sendToCustomerQuietly", () => {
  it("お客さま一人に、お店の公開アドレスを返信先にして送る（お店の宛先は混ぜない）", async () => {
    const { sendToCustomerQuietly } = load(keys);
    await sendToCustomerQuietly("jane@example.com", { subject: "Thank you", text: "..." });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.to).toEqual(["jane@example.com"]);
    expect(body.from).toBe("MIROKU <notify@honmyoujifuji.com>");
    expect(body.reply_to).toBe("info@honmyoujifuji.com");
  });

  it("Resend が断っても投げない", async () => {
    fetchMock.mockResolvedValueOnce(new Response("rate limited", { status: 429 }));
    const { sendToCustomerQuietly } = load(keys);
    await expect(sendToCustomerQuietly("jane@example.com", { subject: "s", text: "t" })).resolves.toBeUndefined();
  });

  it("鍵が無ければ送らない", async () => {
    const { sendToCustomerQuietly } = load({ ...keys, RESEND_API_KEY: undefined });
    await sendToCustomerQuietly("jane@example.com", { subject: "s", text: "t" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
