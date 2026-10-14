/**
 * @jest-environment node
 */

// 新作のお知らせの登録（subscribeNote）。一日の上限はお問い合わせとは別の枠で数える ——
// ここには Turnstile が無いので、同じ枠だと bot がここを叩いてお問い合わせの枠まで使い切れる。

export {};

const notifyStore = jest.fn<Promise<void>, [{ subject: string }]>(async () => {});
const takeFormQuota = jest.fn<Promise<{ ok: true }>, [string, string]>(async () => ({ ok: true }));

jest.mock("server-only", () => ({}));
jest.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.9" }),
}));
jest.mock("@/lib/mail", () => ({ notifyStore: (mail: never) => notifyStore(mail) }));
jest.mock("@/lib/form-quota-gate", () => ({
  takeFormQuota: (ip: string, form: string) => takeFormQuota(ip, form),
}));

type Actions = typeof import("@/app/subscribe/actions");
const { subscribeNote } = jest.requireActual<Actions>("@/app/subscribe/actions");

it("お知らせの登録は「subscribe」の枠で数える", async () => {
  const data = new FormData();
  data.set("email", "ada@example.com");
  const result = await subscribeNote({ status: "idle" }, data);

  expect(result.status).toBe("sent");
  expect(takeFormQuota).toHaveBeenCalledWith("203.0.113.9", "subscribe");
});
