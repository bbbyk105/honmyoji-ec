/** 同じ区分の、今見ている作品以外。並びはカタログのまま（展示の順）。 */
export function otherInLine<T extends { slug: string; line: string }>(
  pieces: readonly T[],
  current: { slug: string; line: string },
): T[] {
  return pieces.filter((piece) => piece.line === current.line && piece.slug !== current.slug);
}
