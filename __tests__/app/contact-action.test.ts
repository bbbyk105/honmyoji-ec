/**
 * @jest-environment node
 */

// お問い合わせの送信（sendInquiry）。人が送っている印（Turnstile）が無いものはお店に届けず、
// 一日の上限も使わせない。営業らしいものは捨てずに、件名に印を付けて届ける。

export {};

type Mail = { subject: string; text: string; replyTo?: string };
const notifyStore = jest.fn<Promise<void>, [Mail]>(async () => {});
const takeFormQuota = jest.fn<Promise<{ ok: true }>, [string]>(async () => ({ ok: true }));

jest.mock("server-only", () => ({}));
jest.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.5" }),
}));
jest.mock("@/lib/mail", () => ({ notifyStore: (mail: never) => notifyStore(mail) }));
jest.mock("@/lib/form-quota-gate", () => ({ takeFormQuota: (ip: string) => takeFormQuota(ip) }));

type Actions = typeof import("@/app/(site)/contact/actions");
const { sendInquiry } = jest.requireActual<Actions>("@/app/(site)/contact/actions");

/** process.env は afterEach で差し替えるので、その時々のものを触る */
const env = () => process.env as Record<string, string | undefined>;
const saved = { ...process.env };
const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>();

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    name: "Ada",
    email: "ada@example.com",
    subject: "question",
    message: "Is Tokiwa still available? I would like it for my sister.",
    "cf-turnstile-response": "tok",
    ...fields,
  })) {
    data.set(key, value);
  }
  return data;
}

const send = (fields: Record<string, string> = {}) => sendInquiry({ status: "idle" }, form(fields));

beforeEach(() => {
  notifyStore.mockClear();
  takeFormQuota.mockClear();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true, action: "contact" })));
  global.fetch = fetchMock as unknown as typeof fetch;
  env().TURNSTILE_SECRET_KEY = "real-secret";
  env().NODE_ENV = "production";
});

afterEach(() => {
  process.env = { ...saved };
});

describe("sendInquiry", () => {
  it("印が通ればお店に届ける。件名に印は付かない", async () => {
    const result = await send();

    expect(result.status).toBe("sent");
    expect(takeFormQuota).toHaveBeenCalledWith("203.0.113.5");
    expect(notifyStore).toHaveBeenCalledTimes(1);
    expect(notifyStore.mock.calls[0][0].subject).toBe("【MIROKU】お問い合わせ — Question about a piece（Ada）");
    expect(notifyStore.mock.calls[0][0].replyTo).toBe("ada@example.com");
  });

  it("印が無いものはお店に届けず、一日の上限も使わせない", async () => {
    const result = await send({ "cf-turnstile-response": "" });

    expect(result).toEqual({ status: "error", message: expect.stringContaining("info@honmyoujifuji.com") });
    expect(notifyStore).not.toHaveBeenCalled();
    expect(takeFormQuota).not.toHaveBeenCalled();
  });

  it("Cloudflare が断った印も届けない", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false, "error-codes": ["invalid-input-response"] })),
    );
    const result = await send();

    expect(result.status).toBe("error");
    expect(notifyStore).not.toHaveBeenCalled();
  });

  it("入力が足りないときは、印を使わずに返す（直して送り直せる）", async () => {
    const result = await send({ message: "hi" });

    expect(result.status).toBe("error");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("営業らしいものも届ける。件名と本文の頭に印を付ける", async () => {
    await send({
      name: "株式会社サンプル 山田",
      message: "ご担当者様\n弊社は集客の支援をしております。一度お話しさせてください。",
    });

    const mail = notifyStore.mock.calls[0][0];
    expect(mail.subject).toBe("【MIROKU】【営業の可能性】お問い合わせ — Question about a piece（株式会社サンプル 山田）");
    expect(mail.text.split("\n")[0]).toBe("※ 営業・売り込みの可能性があります（弊社・ご担当者様・集客）。");
  });

  it("隠し欄が埋まっていれば、送れたふりをして何もしない", async () => {
    const result = await send({ website: "https://spam.example" });

    expect(result.status).toBe("sent");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(notifyStore).not.toHaveBeenCalled();
  });
});
