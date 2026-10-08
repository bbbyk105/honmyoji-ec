/* ------------------------------------------------------------------
   公開フォーム（お問い合わせ・新作のお知らせ）の一日の上限。

   どちらも誰でも送れて、送るたびにお店へメールが一通出る。Resend の無料枠は一日 100 通で、
   注文・お客さまへの確認・ログインの知らせも同じ枠から出る —— いたずらで枠を使い切られると、
   注文のメールが届かなくなる（監査 9）。数えるのは Durable Object（worker/form-quota-object.ts）
   一つ。書き込みが一つずつ順番に通るので、同時に送られても上限を超えない。

   ここは数え方だけ（純粋。テストで直に叩く）。呼び口は lib/form-quota-gate.ts。
   ------------------------------------------------------------------ */

/** 同じ IP から一日に送れる数（お問い合わせとお知らせを合わせて）。 */
export const PER_IP_PER_DAY = 5;

/** サイト全体で一日に送れる数。Resend の一日 100 通のうち半分。残りは注文とログインの知らせに。 */
export const PER_DAY = 50;

export type FormQuotaResult = { ok: true } | { ok: false; reason: "ip" | "day" };

/** Durable Object の storage のうち使う分だけ。 */
export type QuotaStorage = {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  deleteAll(): Promise<void>;
};

/** 日付（UTC）。日が変わったら数え直す。 */
export function quotaDay(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** 一通ぶんを取る。上限なら取らずに理由を返す。 */
export async function takeQuota(storage: QuotaStorage, ip: string, day: string): Promise<FormQuotaResult> {
  if ((await storage.get<string>("day")) !== day) {
    // 前の日の数は要らない。消してから今日を始める（storage が際限なく伸びない）
    await storage.deleteAll();
    await storage.put("day", day);
  }

  const ipKey = `ip:${ip}`;
  const perIp = (await storage.get<number>(ipKey)) ?? 0;
  if (perIp >= PER_IP_PER_DAY) return { ok: false, reason: "ip" };

  const total = (await storage.get<number>("total")) ?? 0;
  if (total >= PER_DAY) return { ok: false, reason: "day" };

  await storage.put(ipKey, perIp + 1);
  await storage.put("total", total + 1);
  return { ok: true };
}
