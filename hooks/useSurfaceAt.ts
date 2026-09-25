"use client";

import { useEffect, useState } from "react";

/**
 * 画面の高さ `y` の線の下にあるのが紙の面かどうか。
 *
 * ヘッダーと章の柱は `fixed` で、下を流れていく節の面（墨 / 紙）を知らない。
 * 墨の面の色のまま紙の上に来ると、生成りの字が紙に溶けて消える（2026-09-25 に面を二つにした）。
 * 線の下にある面を数えて、紙なら部品の側で `tone-paper` を掛ける。
 *
 * 面が入れ子のとき（紙の中に墨を戻したとき）は**いちばん内側**が勝つ。`querySelectorAll` は
 * 文書順に返すので、線に掛かっている最後の一つが一番内側。
 *
 * `y` は px か、画面の高さを受け取る関数。読むのはスクロールと幅の変化と、`key` が
 * 変わったとき（ページ遷移）。読みは rAF で一フレームに一回まで。
 */
export function useSurfaceAt(
  y: number | ((viewportHeight: number) => number),
  key?: unknown,
): boolean | null {
  /*
    `null` は「まだ測っていない」。サーバの HTML と最初の一枚はこの状態で、そのあいだは
    CSS がページの先頭の節の面で代わりに決める（globals.css の `[data-surface-follow]`）。
    false から始めると、紙で始まるページで一瞬だけ生成りの字が出てから墨へ変わる。
  */
  const [paper, setPaper] = useState<boolean | null>(null);

  useEffect(() => {
    let frame = 0;

    const read = () => {
      frame = 0;
      const line = typeof y === "function" ? y(window.innerHeight) : y;
      let onPaper = false;
      for (const el of document.querySelectorAll<HTMLElement>("main .surface-paper, main .surface-dark")) {
        const r = el.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) onPaper = el.classList.contains("surface-paper");
      }
      setPaper(onPaper);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };

    read();
    /* 遷移の直後は新しいページの DOM がまだ入れ替わりの途中にある。一拍おいて読み直す。 */
    const late = window.setTimeout(read, 700);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(late);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
    // `y` は呼び出し側で毎回作られる関数でもよい（読み直しの合図は key とスクロール）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return paper;
}
