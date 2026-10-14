import "server-only";

import { SITE_ORIGIN } from "@/lib/site-url";

export { TURNSTILE_FIELD } from "@/lib/turnstile-field";

/* ------------------------------------------------------------------
   公開フォームの「人が送っているか」の照合（Cloudflare Turnstile）。フォームの中の
   components/site/Turnstile.tsx が作った印を、Cloudflare に問い合わせて確かめる。

   **断るのは「印が無い・偽物・使い回し」のときだけ**。Cloudflare に届かない、秘密が
   入っていない、のようにこちら側の都合で確かめられないときは通す（ログに出す）——
   bot を一日止めそこねるより、お客さまのお問い合わせを落とす方が高くつく。
   一日の上限（lib/form-quota.ts）はそのまま後ろに控えている。
   ------------------------------------------------------------------ */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Cloudflare の試験用の秘密（試験用のサイトキーの印だけを必ず通す）。手元の開発で使う。 */
const TEST_SECRET = "1x0000000000000000000000000000000AA";

/** 印の長さの上限（Cloudflare の仕様は 2048 字）。これより長いものは問い合わせずに断る。 */
const TOKEN_MAX = 2048;

/** Cloudflare の返事を待つ時間。過ぎたら確かめられなかったものとして通す。 */
const TIMEOUT_MS = 5000;

/** こちら側の設定の誤りを表す error-codes。訪問者のせいではないので断らない。 */
const OUR_FAULT = new Set(["missing-input-secret", "invalid-input-secret", "internal-error"]);

/**
 * `spent` は印を Cloudflare に送ったか（送った印は使い切り）。フォームはこれを見て、送っていなければ
 * 印を取り直さない —— 取り直すと、確認の途中の人はやり直しになる。
 */
export type TurnstileResult = { ok: true; skipped?: string } | { ok: false; reason: string; spent: boolean };

type VerifyResponse = { success?: boolean; "error-codes"?: string[]; action?: string; hostname?: string };

/** 本番で印を作ってよい場所（サイトの基準のドメインと www）。Cloudflare の推奨どおり action と一緒に見る。 */
const SITE_HOST = new URL(SITE_ORIGIN).hostname.replace(/^www\./, "");
const ALLOWED_HOSTS = new Set([SITE_HOST, `www.${SITE_HOST}`]);

/**
 * 本番は Worker の秘密（`npx wrangler secret put TURNSTILE_SECRET_KEY`）。手元は .env に本物が
 * 入っていても試験用を使う —— 手元のフォームは試験用のサイトキー（components/site/Turnstile.tsx）
 * の印を出すので、本物の秘密と組むと必ず断られる。
 */
function secretKey(): string | undefined {
  if (process.env.NODE_ENV !== "production") {
    // 本番で黙ってここに来ると、確認が試験用の秘密で回る。手元でだけ見えるように残す
    console.info("[turnstile] 本番ではないので、試験用の秘密で確かめます");
    return TEST_SECRET;
  }
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
  if (!token) return { ok: false, reason: "missing-token", spent: false };
  if (token.length > TOKEN_MAX) return { ok: false, reason: "invalid-token", spent: false };

  const secret = secretKey();
  if (!secret) {
    console.error("[turnstile] TURNSTILE_SECRET_KEY が無いので、確かめずに通しました");
    return { ok: true, skipped: "no-secret" };
  }

  let raw: unknown;
  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret, response: token, ...(ip && ip !== "unknown" ? { remoteip: ip } : {}) }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // 通すのは Cloudflare の不調（5xx）だけ。4xx（429 を含む）は送り手の側で起きうる応答
    // （でたらめな印を大量に送られたときなど）なので、通すと bot まで素通りする
    if (res.status >= 500) {
      console.error(`[turnstile] 照合が ${res.status} を返したので、確かめずに通しました`);
      return { ok: true, skipped: `http-${res.status}` };
    }
    if (!res.ok) {
      console.error(`[turnstile] 照合が ${res.status} を返したので断りました`);
      return { ok: false, reason: `http-${res.status}`, spent: true };
    }
    raw = await res.json();
  } catch (err) {
    console.error("[turnstile] 照合に届かなかった（または応答が読めなかった）ので、確かめずに通しました", err);
    return { ok: true, skipped: "unreachable" };
  }
  if (!raw || typeof raw !== "object") {
    console.error("[turnstile] 照合の応答の形が崩れていたので、確かめずに通しました");
    return { ok: true, skipped: "malformed" };
  }
  const data = raw as VerifyResponse;

  if (data.success === true) {
    // 印にはそれを作ったフォームの action と場所が入っている。試験用の印には入っていないことがある
    if (data.action && data.action !== action) return { ok: false, reason: "action-mismatch", spent: true };
    if (process.env.NODE_ENV === "production" && data.hostname && !ALLOWED_HOSTS.has(data.hostname)) {
      return { ok: false, reason: "hostname-mismatch", spent: true };
    }
    return { ok: true };
  }

  const codes = data["error-codes"] ?? [];
  if (codes.some((code) => OUR_FAULT.has(code))) {
    console.error(`[turnstile] 設定の誤り（${codes.join(", ")}）なので、確かめずに通しました`);
    return { ok: true, skipped: codes.join(",") };
  }
  return { ok: false, reason: codes.join(",") || "rejected", spent: true };
}
