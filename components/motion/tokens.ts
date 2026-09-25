/**
 * 動きの定数。CSS 側の `--ease-soft` / `--dur-*`（app/globals.css）と同じ値を GSAP に渡す。
 *
 * **曲線は一つ**（2026-09-25）。以前は power2 / power3 / expo / power4 が部品ごとに混ざって
 * いて、同じ「現れる」でも節ごとに止まり方が違った。高級に見えるのは効果の数ではなく、
 * 止まりぎわの揃い方のほう。`power4.out` は easeOutQuint で、CSS の
 * `cubic-bezier(0.22, 1, 0.36, 1)` と同じ形になる。
 *
 * 長さは 600–1100ms の中で役ごとに一つずつ。
 */
export const EASE = "power4.out";

/** 開閉のように、両端で速度を落とすもの（メニュー・幕）。 */
export const EASE_IN_OUT = "power3.inOut";

export const DUR = {
  /** 文字の塊が現れる（opacity + 14px） */
  text: 0.9,
  /** 見出しの行がマスクの下から起きる */
  lines: 1.0,
  /** 写真のマスクが開く */
  image: 1.1,
} as const;

/** 見出しの行どうしのずれ（秒）。 */
export const LINE_STAGGER = 0.08;

/** 文字の塊が上がる距離（px）。10–18px の中。 */
export const TEXT_RISE = 14;
