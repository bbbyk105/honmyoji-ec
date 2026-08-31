import { createHash, scryptSync, timingSafeEqual } from "node:crypto";

/* ------------------------------------------------------------------
   /studio の入館証 — メールアドレスと合言葉。**サーバ専用**。

   セッションから切り離してあるのは、ここだけ Next に依存せずに動かせる
   ようにするため（`next/headers` を挟むと素の Node で検証できない）。

   パスワードは scrypt のハッシュで持つ。Vercel のダッシュボードを見られる人にも、
   ログに漏れたときにも、合言葉そのものは分からない。メールアドレスは秘密では
   ないので平文のまま。
   ------------------------------------------------------------------ */

const email = (process.env.STUDIO_EMAIL ?? "").trim().toLowerCase();
const passwordHash = process.env.STUDIO_PASSWORD_HASH ?? "";
const passwordPlain = process.env.STUDIO_PASSWORD ?? "";

export const credentialsConfigured = Boolean(email && (passwordHash || passwordPlain));

/** 合言葉を平文のまま env に置いているか。ログイン画面で移行を促すのに使う。 */
export const passwordIsPlaintext = Boolean(!passwordHash && passwordPlain);

function sha256(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/**
 * `scrypt:<salt>:<hash>`（どちらも base64url）。scripts/studio-secrets.mjs が作る。
 *
 * 区切りが `:` なのは、`$` だと .env の変数展開に食われるため。dotenv は
 * `scrypt$abc$def` の `$abc` と `$def` を未定義の変数として空に置き換えるので、
 * 値が `scrypt` の 6 文字になってログインが必ず失敗する。base64url には
 * `:` が現れないので衝突しない。
 *
 * 鍵長は保存されているハッシュの長さから取る。scrypt のパラメータは Node の
 * 既定（N=16384, r=8, p=1）で、生成側も同じ既定を使っている。
 */
export function verifyScrypt(input: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt" || !parts[1] || !parts[2]) {
    console.error("[studio] STUDIO_PASSWORD_HASH の形式が読めません（scrypt:salt:hash）");
    return false;
  }

  try {
    const salt = Buffer.from(parts[1], "base64url");
    const expected = Buffer.from(parts[2], "base64url");
    if (salt.length === 0 || expected.length === 0) return false;
    return timingSafeEqual(scryptSync(input, salt, expected.length), expected);
  } catch (error) {
    console.error("[studio] 合言葉の照合に失敗", error);
    return false;
  }
}

function passwordMatches(input: string): boolean {
  if (passwordHash) return verifyScrypt(input, passwordHash);
  // 平文どうしでも長さの違いで早く返らないよう、両方を一度ハッシュしてから
  // 定数時間で比べる（生の文字列だと長さそのものが応答時間に出る）
  return timingSafeEqual(sha256(input), sha256(passwordPlain));
}

/**
 * メールアドレスと合言葉の照合。
 *
 * 片方が違っても、もう片方を必ず照合してから返す。メールが違った時点で
 * 返すと、応答の速さの差で「このアドレスは登録されている」が伝わる。
 * 呼び出し側も、どちらが違ったかは画面に出さない。
 */
export function credentialsMatch(inputEmail: string, inputPassword: string): boolean {
  if (!credentialsConfigured) return false;

  const okEmail = timingSafeEqual(sha256(inputEmail.trim().toLowerCase()), sha256(email));
  const okPassword = passwordMatches(inputPassword);
  return okEmail && okPassword;
}
