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
      expect(await takeQuota(s, "203.0.113.7", "2026-10-09", "contact")).toEqual({ ok: true });
    }
    expect(await takeQuota(s, "203.0.113.7", "2026-10-09", "contact")).toEqual({ ok: false, reason: "ip" });
    // 別の IP は送れる
    expect(await takeQuota(s, "198.51.100.1", "2026-10-09", "contact")).toEqual({ ok: true });
  });

  it(`お問い合わせはサイト全体で一日 ${PER_DAY.contact} 通まで（Resend の枠を注文のメールに残す）`, async () => {
    const s = memoryStorage();
    for (let i = 0; i < PER_DAY.contact; i++) {
      expect(await takeQuota(s, `10.0.${Math.floor(i / 200)}.${i % 200}`, "2026-10-09", "contact")).toEqual({ ok: true });
    }
    expect(await takeQuota(s, "192.0.2.1", "2026-10-09", "contact")).toEqual({ ok: false, reason: "day" });
  });

  it("二つのフォームの枠を合わせても、Resend の一日 100 通の半分を超えない", () => {
    expect(PER_DAY.contact + PER_DAY.subscribe).toBeLessThanOrEqual(50);
  });

  it("新作のお知らせの登録が自分の枠を使い切っても、お問い合わせは送れる", async () => {
    // お知らせの登録には Turnstile が無い。同じ枠だと、bot が登録を叩いて一日の枠を使い切り、
    // Turnstile を通ったお客さまのお問い合わせが「今日はいっぱい」で断られる
    const s = memoryStorage();
    for (let i = 0; i < 60; i++) {
      await takeQuota(s, `10.1.${Math.floor(i / 200)}.${i % 200}`, "2026-10-09", "subscribe");
    }
    expect(await takeQuota(s, "192.0.2.1", "2026-10-09", "contact")).toEqual({ ok: true });
  });

  it("フォームの名前が無い・知らない呼び出し（デプロイの切り替わりの旧版）も、お問い合わせの枠で数える", async () => {
    const s = memoryStorage();
    for (let i = 0; i < PER_DAY.contact; i++) {
      await takeQuota(s, `10.2.${Math.floor(i / 200)}.${i % 200}`, "2026-10-09", undefined as never);
    }
    expect(await takeQuota(s, "192.0.2.1", "2026-10-09", "contact")).toEqual({ ok: false, reason: "day" });
  });

  it("日が変われば数え直し、前の日の数は消す", async () => {
    const s = memoryStorage();
    for (let i = 0; i < PER_IP_PER_DAY; i++) await takeQuota(s, "203.0.113.7", "2026-10-09", "contact");
    expect(await takeQuota(s, "203.0.113.7", "2026-10-10", "contact")).toEqual({ ok: true });
    expect([...s.data.keys()].sort()).toEqual(["day", "ip:203.0.113.7", "total:contact"]);
  });

  it("日付は UTC の年月日", () => {
    expect(quotaDay(new Date("2026-10-09T23:30:00+09:00"))).toBe("2026-10-09");
    expect(quotaDay(new Date("2026-10-10T08:59:00+09:00"))).toBe("2026-10-09");
  });
});
