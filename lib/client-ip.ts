import { headers } from "next/headers";

/* ------------------------------------------------------------------
   呼び出し元の IP。ログインの回数制限（lib/studio-guard.ts）と公開フォームの上限
   （lib/form-quota-gate.ts）の鍵。DB に触らないので、公開ページの Server Action から
   読んでも重くならない。
   ------------------------------------------------------------------ */

/**
 * ヘッダーから呼び出し元の IP を選ぶ。回数制限の鍵なので、客が書き換えられる値を使わない。
 *
 * - Cloudflare: `cf-connecting-ip` は Cloudflare が付け、客が送った同名のヘッダーは
 *   上書きされる。`x-forwarded-for` は客が送った値の後ろに足されるだけなので、先頭を
 *   信じると、送るたびに IP を変えて回数制限をすり抜けられる。
 * - Vercel・手元: Vercel は `x-forwarded-for` を自分で書き直すので先頭を信じてよい。
 *   逆に `cf-connecting-ip` は客が自由に送れるので見ない。
 */
export function pickClientIp(h: Pick<Headers, "get">, onWorkers: boolean): string {
  if (onWorkers) return h.get("cf-connecting-ip")?.trim() || "unknown";
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip")?.trim() || "unknown";
}

/** Cloudflare Workers の上か。workerd は navigator.userAgent をこの名前で返す。 */
function onWorkers(): boolean {
  return typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
}

/** 呼び出し元の IP。 */
export async function clientIp(): Promise<string> {
  return pickClientIp(await headers(), onWorkers());
}
