/**
 * @jest-environment node
 */

import { pingDatabase } from "@/worker/keep-alive";

const env = { SUPABASE_URL: "https://abc.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service-key" };

function fetchReturning(status: number) {
  return jest.fn<Promise<Response>, Parameters<typeof fetch>>(
    async () => new Response(status === 200 ? "[]" : "error code: 1016", { status }),
  );
}

describe("pingDatabase", () => {
  it("piece_overrides を一行だけ、service_role の鍵で読む", async () => {
    const fetchMock = fetchReturning(200);

    expect(await pingDatabase(env, fetchMock)).toBe(200);

    const [input, init] = fetchMock.mock.calls[0];
    expect(String(input)).toBe("https://abc.supabase.co/rest/v1/piece_overrides?select=slug&limit=1");
    const headers = new Headers(init?.headers);
    expect(headers.get("apikey")).toBe("service-key");
    expect(headers.get("authorization")).toBe("Bearer service-key");
  });

  it("URL の末尾に / があっても同じ所を読む", async () => {
    const fetchMock = fetchReturning(200);
    await pingDatabase({ ...env, SUPABASE_URL: "https://abc.supabase.co/" }, fetchMock);
    expect(String(fetchMock.mock.calls[0][0])).toBe("https://abc.supabase.co/rest/v1/piece_overrides?select=slug&limit=1");
  });

  it("鍵が無ければ何もしない", async () => {
    const fetchMock = fetchReturning(200);
    expect(await pingDatabase({}, fetchMock)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("読めなければ投げる（定期実行の失敗としてログに残す）", async () => {
    await expect(pingDatabase(env, fetchReturning(530))).rejects.toThrow("Supabase 530");
  });
});
