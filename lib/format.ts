/**
 * 通し番号の字面。サイト中どこでも `01 / 05`（DESIGN.md）。
 * レール・メニュー・スワイプ帯・ビューアが同じ `padStart(2, "0")` を書いていた。
 */
export function twoDigits(n: number): string {
  return String(n).padStart(2, "0");
}
