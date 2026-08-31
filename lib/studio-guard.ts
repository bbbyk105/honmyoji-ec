import { headers } from "next/headers";

import { db } from "@/lib/supabase";

/* ------------------------------------------------------------------
   ログインの回数制限。**サーバ専用**。

   合言葉も 6 桁コードも、何度でも試せるなら時間の問題で破られる。硬さの
   ほとんどはここが担っている。

   記録先は Supabase。サーバーレスでは実行ごとにメモリが別なので、プロセス内の
   カウンタは本番で意味を成さない。DB が無いとき（ローカル・鍵を入れる前）だけ
   メモリに落ちる。
   ------------------------------------------------------------------ */

/** 直近この分数の失敗を数える。 */
const WINDOW_MINUTES = 15;

/** これだけ失敗したら、窓が抜けるまで受け付けない。 */
const MAX_FAILURES = 5;

export type Gate = { allowed: true } | { allowed: false; retryAfterMinutes: number };

/**
 * 呼び出し元の IP。
 *
 * Vercel は `x-forwarded-for` を自分で書き直すので信頼できる。自前のリバース
 * プロキシを挟むなら、そこで詐称できないことを確かめること。
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip")?.trim() || "unknown";
}

// DB が無いときの受け皿。プロセスが生きている間だけ。
const memory = new Map<string, number[]>();

function memoryFailures(ip: string): number {
  const since = Date.now() - WINDOW_MINUTES * 60_000;
  const kept = (memory.get(ip) ?? []).filter((t) => t > since);
  memory.set(ip, kept);
  return kept.length;
}

export async function checkGate(ip: string): Promise<Gate> {
  const client = db();

  if (!client) {
    const failures = memoryFailures(ip);
    return failures >= MAX_FAILURES
      ? { allowed: false, retryAfterMinutes: WINDOW_MINUTES }
      : { allowed: true };
  }

  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  try {
    const { data, error } = await client
      .from("studio_auth_attempts")
      .select("at")
      .eq("ip", ip)
      .eq("ok", false)
      .gte("at", since)
      .order("at", { ascending: true });
    if (error) throw error;

    const failures = data ?? [];
    if (failures.length < MAX_FAILURES) return { allowed: true };

    // 一番古い失敗が窓から抜けるまで待たせる
    const oldest = new Date(failures[0].at as string).getTime();
    const remainingMs = oldest + WINDOW_MINUTES * 60_000 - Date.now();
    return { allowed: false, retryAfterMinutes: Math.max(1, Math.ceil(remainingMs / 60_000)) };
  } catch (error) {
    // 数えられないときは通す。ここで閉じると、DB の不調がそのまま締め出しになる
    console.error("[studio] ログイン試行を数えられませんでした", error);
    return { allowed: true };
  }
}

export async function recordAttempt(ip: string, ok: boolean, reason?: string): Promise<void> {
  const client = db();

  if (!client) {
    if (!ok) memory.set(ip, [...(memory.get(ip) ?? []), Date.now()]);
    else memory.delete(ip);
    return;
  }

  try {
    await client.from("studio_auth_attempts").insert({ ip, ok, reason: reason ?? null });
    if (ok) {
      // 入れた人を疑い続けない。成功したらその IP の失敗は帳消し
      await client.from("studio_auth_attempts").delete().eq("ip", ip).eq("ok", false);
      // ついでに古い記録を落とす。ログインは一日に数回なので、掃除の口を
      // ここに置いておけば表が無限に伸びない
      const old = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();
      await client.from("studio_auth_attempts").delete().lt("at", old);
    }
  } catch (error) {
    console.error("[studio] ログイン試行を記録できませんでした", error);
  }
}

/** 直近の失敗回数。あと何回で締まるかを画面に出すのに使う。 */
export async function recentFailures(ip: string): Promise<number> {
  const client = db();
  if (!client) return memoryFailures(ip);

  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  try {
    const { count, error } = await client
      .from("studio_auth_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .eq("ok", false)
      .gte("at", since);
    if (error) throw error;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export const LOGIN_LIMITS = { maxFailures: MAX_FAILURES, windowMinutes: WINDOW_MINUTES };
