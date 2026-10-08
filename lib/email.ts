/** RFC 5321 の上限。これより長いアドレスはそもそも届かない。 */
export const EMAIL_MAX_LENGTH = 254;

/**
 * 公開フォームのメールアドレスの形だけを見る（届くかどうかは送るまで分からない）。
 *
 * **長さを先に見る**。下の正規表現は `.` の前後の欄がどちらも `.` を受けるので、
 * `a@....@` のように `.` を並べて末尾だけ崩した文字列では、`.` の位置を総当たりして
 * 長さの 2 乗の手間がかかる。欄の長さを抑えなければ、Server Action の本文の上限
 * （1MB）まで詰めた一回の送信で、Worker の CPU を使い切らせられる。
 */
export function isEmail(value: string): boolean {
  return value.length <= EMAIL_MAX_LENGTH && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
