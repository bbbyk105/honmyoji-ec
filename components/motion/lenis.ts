import type Lenis from "lenis";

/* ------------------------------------------------------------------
   Lenis の手綱。インスタンスを作るのは `SmoothScroll` だけで、ここは
   「いま居るなら止める / 動かす / 送る」の窓口。

   `SmoothScroll.tsx` から分けてあるのは、止めたいだけの部品（カート・メニュー・
   ビューア・`useScrollLock`）が Lenis 本体と GSAP を import しなくて済むようにするため。
   型しか読まないので、このファイル自体は何も持ち込まない。
   ------------------------------------------------------------------ */

/** ヘッダーの高さ。章へ送るとき、見出しがヘッダーの下に潜らないように引く。 */
export const HEADER_OFFSET = 88;

let lenis: Lenis | null = null;

/** `SmoothScroll` が作ったとき・壊したときに呼ぶ。 */
export function setLenis(instance: Lenis | null) {
  lenis = instance;
}

export function getLenis(): Lenis | null {
  return lenis;
}

export function stopLenis() {
  lenis?.stop();
}

export function startLenis() {
  lenis?.start();
}

/**
 * 章のレールから送る。Lenis が居るときは Lenis に頼む —— ネイティブの smooth と
 * 慣性スクロールは同時に走ると引っ張り合う（`html { scroll-behavior }` を auto に
 * してあるのと同じ理由）。`id` が null ならページの先頭（ヒーロー）。
 */
export function scrollToChapter(id: string | null) {
  const target = id ? document.getElementById(id) : null;
  if (id && !target) return;

  if (lenis) {
    lenis.scrollTo(target ?? 0, { offset: target ? -HEADER_OFFSET : 0, force: true });
    return;
  }
  if (target) {
    target.scrollIntoView({ behavior: "smooth" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}
