import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { STUDIO_COOKIE } from "@/lib/studio-cookie";
import { credentialsConfigured } from "@/lib/studio-credentials";

/* ------------------------------------------------------------------
   /studio の鍵。**サーバ専用**。

   運用者は一人なので、アカウント表もロールも作らない。入口はメールアドレスと
   合言葉の一組だけで、硬さは次の三つで作っている。

     1. 合言葉は scrypt のハッシュで持つ（STUDIO_PASSWORD_HASH）
     2. 回数制限（lib/studio-guard.ts）— 何度でも試せるなら 1 は飾りになる
     3. セッションはブラウザに縛る — cookie を抜かれても、別のブラウザでは通らない

   proxy.ts は cookie が「有る」ことしか見ない（Edge に node:crypto が無い）。
   本当の検証はここ —— ページと Server Action が毎回 requireSession() を通る。
   ------------------------------------------------------------------ */

export { STUDIO_COOKIE };

/** 8 時間。ひと仕事より長く、置き忘れたままにするには短い。 */
const MAX_AGE_SECONDS = 60 * 60 * 8;

/** cookie の形式。作り方を変えたら上げる（古い cookie が一斉に無効になる）。 */
const VERSION = "v2";

const secret = process.env.STUDIO_SESSION_SECRET ?? "";

/** 入館証と署名鍵が揃っているか。どれか欠けたら誰も入れない。 */
export const studioConfigured = credentialsConfigured && Boolean(secret);

export { passwordIsPlaintext, credentialsMatch } from "@/lib/studio-credentials";

function sign(payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

// ---------------------------------------------------------------- セッション

/**
 * セッションを結びつけるブラウザの印。
 *
 * User-Agent だけを使う。IP は移動や回線の切り替えで変わるので、混ぜると
 * 電車で移動しただけでログアウトする。ブラウザを更新すると切れるが、
 * 運用者は一人なので入り直せば済む。
 */
async function browserTag(): Promise<string> {
  const ua = (await headers()).get("user-agent") ?? "";
  return createHash("sha256").update(ua, "utf8").digest("base64url").slice(0, 16);
}

export async function createSession(): Promise<void> {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${VERSION}.${expiresAt}.${await browserTag()}`;
  const jar = await cookies();

  jar.set(STUDIO_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // strict ではなく lax。strict は外部サイトのリンクから開いたときにも
    // cookie を送らないので、Stripe のダッシュボードやメールから /studio を
    // 開くたびにログインし直しになる（実際に踏んだ）。Server Action は POST
    // なので、lax でもクロスサイトからの書き込みには cookie が付かない
    // —— strict で増える安全性は「外部リンクから画面を表示させない」ぶんだけ。
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(STUDIO_COOKIE);
}

/** 一度のレンダリングで cookie を何度も開き直さないよう cache する。 */
export const verifySession = cache(async (): Promise<boolean> => {
  if (!studioConfigured) return false;

  const raw = (await cookies()).get(STUDIO_COOKIE)?.value;
  if (!raw) return false;

  const at = raw.lastIndexOf(".");
  if (at < 1) return false;

  const payload = raw.slice(0, at);
  const mac = raw.slice(at + 1);
  const expected = sign(payload);

  if (mac.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return false;

  const [version, expiresAt, tag] = payload.split(".");
  if (version !== VERSION) return false;

  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry) || expiry <= Date.now()) return false;

  // 署名が正しくても、別のブラウザに貼られた cookie なら通さない
  return tag === (await browserTag());
});

/** ページと Server Action の入口。通らなければログインへ返す。 */
export async function requireSession(): Promise<void> {
  if (!(await verifySession())) redirect("/studio/login");
}
