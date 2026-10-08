import { db } from "@/lib/supabase";

// IP の取り方は lib/client-ip.ts（公開フォームも使う）。ここからも読めるように
export { clientIp, pickClientIp } from "@/lib/client-ip";

/* ------------------------------------------------------------------
   ログインの回数制限。**サーバ専用**。

   合言葉も 6 桁コードも、何度でも試せるなら時間の問題で破られる。硬さの
   ほとんどはここが担っている。

   記録先は Supabase。サーバーレスでは実行ごとにメモリが別なので、プロセス内の
   カウンタは本番で意味を成さない。DB が無いとき（ローカル・鍵を入れる前）だけ
   メモリに落ちる。

   **数える前に記録する**。以前は「数える → 照合する → 失敗を記録する」の順で、
   同時に送った N 本が全部「まだ 0 回」を見て通り、15 分 5 回の上限が N 回になった。
   失敗を一つ先に書いてから数えれば、後から書いた方は必ず先の分を数えるので、
   同時に送っても上限を超えては通らない。合っていたら、その IP の失敗ごと消す。
   ------------------------------------------------------------------ */

/** 直近この分数の失敗を数える。 */
const WINDOW_MINUTES = 15;

/** これだけ失敗したら、窓が抜けるまで受け付けない。 */
const MAX_FAILURES = 5;

export type Gate =
  | {
      allowed: true;
      /** これが上限の一回なら、外したときに締め出す分数。まだ余裕があれば null */
      lockoutMinutes: number | null;
    }
  | { allowed: false; retryAfterMinutes: number };

// DB が無いときの受け皿。プロセスが生きている間だけ。
const memory = new Map<string, number[]>();

/** 一番古い失敗が窓から抜けるまでの分数。 */
function minutesUntilFree(oldest: number): number {
  const remainingMs = oldest + WINDOW_MINUTES * 60_000 - Date.now();
  return Math.max(1, Math.ceil(remainingMs / 60_000));
}

/**
 * 一回ぶんの試行を取る。**パスワードを照合する前に**呼ぶ。
 *
 * 失敗を一つ先に書き、窓の中の失敗（いま書いた分を含む）を数える。上限を超えていたら
 * 書いた分を消して断る —— 締め出している間の試行まで数えると、攻撃が続く限り持ち主も
 * 入れない。照合に通ったら `recordSuccess()` がこの分ごと消す。通らなければ、書いた分が
 * そのまま失敗の記録になる。
 */
export async function takeAttempt(ip: string): Promise<Gate> {
  const since = Date.now() - WINDOW_MINUTES * 60_000;
  const client = db();

  if (!client) {
    const kept = (memory.get(ip) ?? []).filter((t) => t > since);
    if (kept.length >= MAX_FAILURES) {
      memory.set(ip, kept);
      return { allowed: false, retryAfterMinutes: minutesUntilFree(kept[0]) };
    }
    kept.push(Date.now());
    memory.set(ip, kept);
    return { allowed: true, lockoutMinutes: kept.length >= MAX_FAILURES ? minutesUntilFree(kept[0]) : null };
  }

  try {
    const { data: mine, error: insertError } = await client
      .from("studio_auth_attempts")
      .insert({ ip, ok: false })
      .select("id")
      .single();
    if (insertError) throw insertError;

    const { data, error } = await client
      .from("studio_auth_attempts")
      .select("at")
      .eq("ip", ip)
      .eq("ok", false)
      .gte("at", new Date(since).toISOString())
      .order("at", { ascending: true });
    if (error) throw error;

    const failures = data ?? [];
    const oldest = failures.length > 0 ? new Date(failures[0].at as string).getTime() : Date.now();
    if (failures.length <= MAX_FAILURES) {
      return { allowed: true, lockoutMinutes: failures.length >= MAX_FAILURES ? minutesUntilFree(oldest) : null };
    }

    await client.from("studio_auth_attempts").delete().eq("id", mine.id);
    return { allowed: false, retryAfterMinutes: minutesUntilFree(oldest) };
  } catch (error) {
    // 数えられないときは通す。ここで閉じると、DB の不調がそのまま締め出しになる
    console.error("[studio] ログイン試行を数えられませんでした", error);
    return { allowed: true, lockoutMinutes: null };
  }
}

/** 照合に通った。この IP の失敗（`takeAttempt` が先に書いた分を含む）を帳消しにする。 */
export async function recordSuccess(ip: string): Promise<void> {
  const client = db();

  if (!client) {
    memory.delete(ip);
    return;
  }

  try {
    await client.from("studio_auth_attempts").insert({ ip, ok: true });
    // 入れた人を疑い続けない。成功したらその IP の失敗は帳消し
    await client.from("studio_auth_attempts").delete().eq("ip", ip).eq("ok", false);
    // ついでに古い記録を落とす。ログインは一日に数回なので、掃除の口を
    // ここに置いておけば表が無限に伸びない
    const old = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();
    await client.from("studio_auth_attempts").delete().lt("at", old);
  } catch (error) {
    console.error("[studio] ログイン試行を記録できませんでした", error);
  }
}

export const LOGIN_LIMITS = { maxFailures: MAX_FAILURES, windowMinutes: WINDOW_MINUTES };
