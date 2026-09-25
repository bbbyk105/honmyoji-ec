/**
 * 遷移をまたいで届く慣性を捨てる（2026-09-25）。
 *
 * macOS のトラックパッドは指を離したあとも 1 秒ほど wheel（慣性）を送り続ける。一覧を流しながら
 * 作品を押すと、ページは先頭へ跳ぶ（`SmoothScroll` の `jumpToTop`）が、その直後に前のページの
 * 慣性が届いて、新しいページが勝手に下へ流れていく（計測: 押してから 0.9 秒の慣性で 2000px）。
 *
 * 遷移した時点で wheel が続いていたら、それが**途切れるまで**（間が 150ms 空くまで）は受け取らない。
 * 途切れたあとの wheel は新しい手の動きなので普通に効く。遷移の時点で wheel が止まっていたなら
 * 何もしない。念のため上限 1.5 秒。
 *
 * `onWheel` は window の**捕捉フェーズ**で受けること。実際の wheel はページ内の要素に届くので、
 * window の捕捉が一番先に走り、Lenis（window の通常フェーズ）にも素のスクロールにも渡らない。
 */
export const MOMENTUM_GAP_MS = 150;
export const MOMENTUM_MAX_MS = 1500;

export function createMomentumGuard(now: () => number = () => performance.now()) {
  let lastWheelAt = -Infinity;
  let swallowUntil = -Infinity;

  return {
    /** 捨てたら true（呼ぶ側で preventDefault / stopImmediatePropagation する）。 */
    onWheel(): boolean {
      const t = now();
      const continuing = t - lastWheelAt < MOMENTUM_GAP_MS;
      lastWheelAt = t;
      if (t > swallowUntil) return false;
      if (!continuing) {
        swallowUntil = -Infinity;
        return false;
      }
      return true;
    },
    /** 遷移した瞬間に呼ぶ。慣性が流れている最中だったときだけ、それを捨て始める。 */
    arm(): void {
      const t = now();
      swallowUntil = t - lastWheelAt < MOMENTUM_GAP_MS ? t + MOMENTUM_MAX_MS : -Infinity;
    },
  };
}
