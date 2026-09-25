/**
 * 「動きを減らす」の設定。effect / useGSAP の中から読む（描画中には呼ばない ——
 * サーバには window が無く、hydration の結果が食い違う）。
 *
 * 以前は九つの部品が同じ `matchMedia(...)` を一行ずつ手書きしていた。
 */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
