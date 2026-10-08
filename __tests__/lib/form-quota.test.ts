import { PER_DAY, PER_IP_PER_DAY, quotaDay, takeQuota, type QuotaStorage } from "@/lib/form-quota";

/** Durable Object の storage の代わり。 */
function memoryStorage(): QuotaStorage & { data: Map<string, unknown> } {
  const data = new Map<string, unknown>();
  return {
    data,
    async get<T>(key: string) {
      return data.get(key) as T | undefined;
    },
    async put<T>(key: string, value: T) {
      data.set(key, value);
    },
    async deleteAll() {
      data.clear();
    },
  };
}

describe("takeQuota", () => {
  it(`同じ IP は一日 ${PER_IP_PER_DAY} 通まで`, async () => {
    const s = memoryStorage();
    for (let i = 0; i < PER_IP_PER_DAY; i++) {
      expect(await takeQuota(s, "203.0.113.7", "2026-10-09")).toEqual({ ok: true });
    }
    expect(await takeQuota(s, "203.0.113.7", "2026-10-09")).toEqual({ ok: false, reason: "ip" });
    // 別の IP は送れる
    expect(await takeQuota(s, "198.51.100.1", "2026-10-09")).toEqual({ ok: true });
  });

  it(`サイト全体で一日 ${PER_DAY} 通まで（Resend の枠を注文のメールに残す）`, async () => {
    const s = memoryStorage();
    for (let i = 0; i < PER_DAY; i++) {
      expect(await takeQuota(s, `10.0.${Math.floor(i / 200)}.${i % 200}`, "2026-10-09")).toEqual({ ok: true });
    }
    expect(await takeQuota(s, "192.0.2.1", "2026-10-09")).toEqual({ ok: false, reason: "day" });
  });

  it("日が変われば数え直し、前の日の数は消す", async () => {
    const s = memoryStorage();
    for (let i = 0; i < PER_IP_PER_DAY; i++) await takeQuota(s, "203.0.113.7", "2026-10-09");
    expect(await takeQuota(s, "203.0.113.7", "2026-10-10")).toEqual({ ok: true });
    expect([...s.data.keys()].sort()).toEqual(["day", "ip:203.0.113.7", "total"]);
  });

  it("日付は UTC の年月日", () => {
    expect(quotaDay(new Date("2026-10-09T23:30:00+09:00"))).toBe("2026-10-09");
    expect(quotaDay(new Date("2026-10-10T08:59:00+09:00"))).toBe("2026-10-09");
  });
});
