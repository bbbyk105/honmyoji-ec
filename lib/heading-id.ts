/**
 * 見出しの文字から id を作る（記事の目次が使う）。同じ見出しが二つあっても
 * 衝突しないよう連番を足す。`taken` は呼び出し側が記事ごとに一つ持つ。
 */
export function headingId(text: string, taken: Set<string>): string {
  const base =
    text
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "section";
  let id = base;
  let n = 2;
  while (taken.has(id)) id = `${base}-${n++}`;
  taken.add(id);
  return id;
}
