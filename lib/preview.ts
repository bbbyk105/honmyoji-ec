/* ------------------------------------------------------------------
   下書きプレビュー（Draft Mode）の共有部品。

   microCMS の「画面プレビュー」から来る `/api/preview` が、秘密鍵を
   確かめてから Next の Draft Mode を立て、記事ページ（/blog/[slug]）へ
   内部の URL だけに転送する。記事ページは Draft Mode の間だけ draftKey
   付きで下書きを取り、ISR/OpenNext のキャッシュに載せない。

   このモジュールは **Next にも node:crypto にも依存しない**（純粋関数だけ）。
   - 記事ページは cookie 名の定数だけを読む（crypto を記事のバンドルに載せない）。
   - 転送先の検証と秘密鍵の照合は jest（node）で単体で確かめられる。
   ------------------------------------------------------------------ */

/** draftKey を預ける cookie 名。Draft Mode の間だけ記事ページが読む。 */
export const PREVIEW_DRAFT_COOKIE = "miroku-draft-key";

/** 秘密鍵の環境変数名（値はコードに持たない）。 */
export const PREVIEW_SECRET_ENV = "MICROCMS_PREVIEW_SECRET";

/**
 * 制御文字・空白（タブ・改行を含む）・バックスラッシュが混じっていないか。
 * ブラウザは `\` を `/` として扱うので、`/\evil.com` のような細工は
 * プロトコル相対と同じく弾きたい。コード点 0x20 以下はすべて不可とする。
 */
function hasUnsafeChar(path: string): boolean {
  for (let i = 0; i < path.length; i++) {
    const c = path.charCodeAt(i);
    if (c <= 0x20 || c === 0x5c /* backslash */) return true;
  }
  return false;
}

/**
 * 転送先として安全な「内部パス」だけを通す。外部 URL・プロトコル相対
 * （`//evil.com`）・スキーム（`javascript:`）・バックスラッシュ細工は
 * 弾いて fallback に落とす。
 *
 * オープンリダイレクト対策：秘密鍵を知らなくても踏めるのは最後の転送だけ
 * なので、ここで外へ飛ばせると「本物のドメインから偽サイトへ」送れてしまう。
 */
export function safeInternalPath(
  raw: string | null | undefined,
  fallback = "/blog",
): string {
  if (!raw) return fallback;
  // 先頭・末尾の空白を剝ぐ（" //evil" のような隙間での偽装を防ぐ）。
  const path = raw.trim();
  // 内部パスは必ず単一の "/" で始まる。"//" はプロトコル相対として弾く。
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//")) return fallback;
  if (hasUnsafeChar(path)) return fallback;
  return path;
}

/**
 * 秘密鍵の照合。環境変数 `MICROCMS_PREVIEW_SECRET` が無いときは必ず拒否
 * （未設定の環境でプレビューを開けないようにする）。長さが違えば早く返すが、
 * 一致判定そのものは定数時間（文字ごとの XOR の総和）で、応答時間から
 * 鍵の中身が漏れないようにする。node:crypto を読まないため自前で組む。
 */
export function previewSecretOk(provided: string | null | undefined): boolean {
  const secret = process.env[PREVIEW_SECRET_ENV];
  if (!secret || !provided) return false;
  if (provided.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) {
    diff |= provided.charCodeAt(i) ^ secret.charCodeAt(i);
  }
  return diff === 0;
}
