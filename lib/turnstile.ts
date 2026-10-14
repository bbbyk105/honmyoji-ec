import "server-only";

/* ------------------------------------------------------------------
   公開フォームの「人が送っているか」の照合（Cloudflare Turnstile）。フォームの中の
   components/site/Turnstile.tsx が作った印を、Cloudflare に問い合わせて確かめる。

   **断るのは「印が無い・偽物・使い回し」のときだけ**。Cloudflare に届かない、秘密が
   入っていない、のようにこちら側の都合で確かめられないときは通す（ログに出す）——
   bot を一日止めそこねるより、お客さまのお問い合わせを落とす方が高くつく。
   一日の上限（lib/form-quota.ts）はそのまま後ろに控えている。
   ------------------------------------------------------------------ */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** フォームが印を入れる欄（Turnstile の既定の名前）。 */
export const TURNSTILE_FIELD = "cf-turnstile-response";

/** Cloudflare の試験用の秘密（試験用のサイトキーの印だけを必ず通す）。手元の開発で使う。 */
const TEST_SECRET = "1x0000000000000000000000000000000AA";

/** 印の長さの上限（Cloudflare の仕様は 2048 字）。これより長いものは問い合わせずに断る。 */
const TOKEN_MAX = 2048;

/** Cloudflare の返事を待つ時間。過ぎたら確かめられなかったものとして通す。 */
const TIMEOUT_MS = 5000;

/** こちら側の設定の誤りを表す error-codes。訪問者のせいではないので断らない。 */
const OUR_FAULT = new Set(["missing-input-secret", "invalid-input-secret", "internal-error"]);

export type TurnstileResult = { ok: true; skipped?: string } | { ok: false; reason: string };

type VerifyResponse = { success?: boolean; "error-codes"?: string[]; action?: string };

/**
 * 本番は Worker の秘密（`npx wrangler secret put TURNSTILE_SECRET_KEY`）。手元は .env に本物が
 * 入っていても試験用を使う —— 手元のフォームは試験用のサイトキー（components/site/Turnstile.tsx）
 * の印を出すので、本物の秘密と組むと必ず断られる。
 */
function secretKey(): string | undefined {
  if (process.env.NODE_ENV !== "production") return TEST_SECRET;
  return process.env.TURNSTILE_SECRET_KEY || undefined;
}

/**
 * 印を確かめる。`action` は部品に渡したものと同じ値（別のフォームの印を使い回させない）。
 * `ip` は訪問者の IP（分かれば。Cloudflare の判定の材料になる）。
 */
export async function verifyTurnstile(
  token: string,
  { action, ip }: { action: string; ip?: string },
): Promise<TurnstileResult> {
  if (!token) return { ok: false, reason: "missing-token" };
  if (token.length > TOKEN_MAX) return { ok: false, reason: "invalid-token" };

  const secret = secretKey();
  if (!secret) {
    console.error("[turnstile] TURNSTILE_SECRET_KEY が無いので、確かめずに通しました");
    return { ok: true, skipped: "no-secret" };
  }

  let data: VerifyResponse;
  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret, response: token, ...(ip && ip !== "unknown" ? { remoteip: ip } : {}) }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[turnstile] 照合が ${res.status} を返したので、確かめずに通しました`);
      return { ok: true, skipped: `http-${res.status}` };
    }
    data = (await res.json()) as VerifyResponse;
  } catch (err) {
    console.error("[turnstile] 照合に届かなかったので、確かめずに通しました", err);
    return { ok: true, skipped: "unreachable" };
  }

  if (data.success === true) {
    // 印にはそれを作ったフォームの action が入っている。試験用の印には入っていないことがある
    if (data.action && data.action !== action) return { ok: false, reason: "action-mismatch" };
    return { ok: true };
  }

  const codes = data["error-codes"] ?? [];
  if (codes.some((code) => OUR_FAULT.has(code))) {
    console.error(`[turnstile] 設定の誤り（${codes.join(", ")}）なので、確かめずに通しました`);
    return { ok: true, skipped: codes.join(",") };
  }
  return { ok: false, reason: codes.join(",") || "rejected" };
}
