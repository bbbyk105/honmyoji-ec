import { createHash, scryptSync, timingSafeEqual } from "node:crypto";

/* ------------------------------------------------------------------
   /studio の入館証 — メールアドレスとパスワード。**サーバ専用**。

   アカウントは環境変数に並べる。DB にユーザー表は作らない —— 増えても
   数人で、招待も権限もパスワード再発行も要らないなら、表を持つと管理する
   ものが増えるだけになる。

     STUDIO_EMAIL           / STUDIO_PASSWORD_HASH
     STUDIO_EMAIL_2         / STUDIO_PASSWORD_HASH_2
     STUDIO_EMAIL_3         / STUDIO_PASSWORD_HASH_3   … 5 まで

   セッションから切り離してあるのは、ここだけ Next に依存せずに動かせる
   ようにするため（`next/headers` を挟むと素の Node で検証できない）。

   パスワードは scrypt のハッシュで持つ。Vercel のダッシュボードを見られる人にも、
   ログに漏れたときにも、パスワードそのものは分からない。メールアドレスは秘密では
   ないので平文のまま。
   ------------------------------------------------------------------ */

const SLOTS = ["", "_2", "_3", "_4", "_5"] as const;

type Account = { email: string; hash: string; plain: string };

function collect(): Account[] {
  const accounts: Account[] = [];
  for (const slot of SLOTS) {
    const email = (process.env[`STUDIO_EMAIL${slot}`] ?? "").trim().toLowerCase();
    const hash = process.env[`STUDIO_PASSWORD_HASH${slot}`] ?? "";
    const plain = process.env[`STUDIO_PASSWORD${slot}`] ?? "";
    if (email && (hash || plain)) accounts.push({ email, hash, plain });
  }
  return accounts;
}

const accounts = collect();

export const credentialsConfigured = accounts.length > 0;

/** 何人分の入館証があるか。ログイン画面には出さない（人数も手掛かりになる）。 */
export const accountCount = accounts.length;

/** ハッシュ化していないアカウントが混ざっているか。ログイン画面で移行を促すのに使う。 */
export const passwordIsPlaintext = accounts.some((a) => !a.hash);

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
    console.error("[studio] パスワードの照合に失敗", error);
    return false;
  }
}

function passwordOk(input: string, account: Account): boolean {
  if (account.hash) return verifyScrypt(input, account.hash);
  // 平文どうしでも長さの違いで早く返らないよう、両方を一度ハッシュしてから
  // 定数時間で比べる（生の文字列だと長さそのものが応答時間に出る）
  return timingSafeEqual(sha256(input), sha256(account.plain));
}

/**
 * 入館証の照合。合っていればそのアカウントのメールアドレス、違えば null。
 *
 * **一致した時点で止めない。** 早く返すと、応答の速さの差で「このアドレスは
 * 登録されている」「何番目のアカウントか」が漏れる。全員ぶん照合してから返す。
 * scrypt は意図的に重いので数百 ms かかるが、ログインは一日に数回の操作で、
 * その重さこそが総当たりを止めている。
 */
export function matchAccount(inputEmail: string, inputPassword: string): string | null {
  if (!credentialsConfigured) return null;

  const email = inputEmail.trim().toLowerCase();
  let matched: string | null = null;

  for (const account of accounts) {
    const okEmail = timingSafeEqual(sha256(email), sha256(account.email));
    const okPassword = passwordOk(inputPassword, account);
    if (okEmail && okPassword) matched = account.email;
  }
  return matched;
}

/** 真偽だけ要るとき。 */
export function credentialsMatch(inputEmail: string, inputPassword: string): boolean {
  return matchAccount(inputEmail, inputPassword) !== null;
}
