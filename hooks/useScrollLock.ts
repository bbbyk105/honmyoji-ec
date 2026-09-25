import { useEffect } from "react";

import { startLenis, stopLenis } from "@/components/motion/lenis";

/* ------------------------------------------------------------------
   背後のページを止める。メニュー・カート・写真のビューア・入場の幕が使う。

   **数えて止める。** 以前は四つの部品がそれぞれ `body.style.overflow` と Lenis を
   直に触っていて、閉じた側が開いている側のロックまで外していた —— メニューの effect の
   deps に一つ足すだけでカートの `stopLenis` が打ち消される、という脆さ（SiteHeader の註）。
   いまは最後の一人が離れたときだけ外れる。
   ------------------------------------------------------------------ */

let holders = 0;

/**
 * 止めて、外す関数を返す。外す関数は何度呼んでも一回ぶんしか数えない
 * （effect の cleanup と完了のコールバックの両方から呼ばれても壊れない）。
 */
export function lockScroll(): () => void {
  holders += 1;
  if (holders === 1) {
    document.body.style.overflow = "hidden";
    stopLenis();
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    holders = Math.max(0, holders - 1);
    if (holders === 0) {
      document.body.style.overflow = "";
      startLenis();
    }
  };
}

/** `active` の間だけ止める。 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    return lockScroll();
  }, [active]);
}
