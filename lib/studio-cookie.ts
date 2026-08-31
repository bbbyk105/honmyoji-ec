/**
 * セッション cookie の名前だけ。node:crypto を持ち込まずに proxy.ts（Edge）から
 * 読めるよう、`lib/studio-session.ts` とは別のファイルにしてある。
 *
 * 本番は `__Host-` 接頭辞を付ける。ブラウザはこの名前の cookie に
 * 「Secure かつ Path=/ かつ Domain 指定なし」を強制するので、同じ登録ドメインの
 * 別サブドメイン（乗っ取られた `foo.example.com` など）から書き込まれた偽の
 * セッションが混ざらない。ローカルは http なので Secure が付かず、接頭辞を
 * 付けるとブラウザに捨てられる — 開発では素の名前を使う。
 */
const BASE = "miroku_studio";

export const STUDIO_COOKIE =
  process.env.NODE_ENV === "production" ? `__Host-${BASE}` : BASE;
