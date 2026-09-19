"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * ページの移り変わり。
 *
 * **見た目は CSS が持つ**（`app/globals.css` の `::view-transition-*`）。この部品がするのは、
 * 押された導線が「作品のモーフか、そうでないか」を `html` に印として置くことだけ。
 *
 * 以前は黒い板を下から上へ走らせる DOM の幕だった（`RouteCurtain`）。やめた理由は二つ：
 *  1. サイト中の所作がほぼ全部「下から上」で、いちばん大きい動きまで同じ向きだった。
 *     同じ所作の反復は丁寧ではなく安く見える（2026-09-20）。
 *  2. 幕は「覆う 0.5 秒 → 遷移 → 明ける 0.66 秒」と、待ち時間を自分で作っていた。
 *     View Transition なら前後のページが両方ある状態で組めるので、**前のページが奥へ退き、
 *     新しいページが中央から左右へ開く**（ヒーローの `band` と同じ語彙）を、待ち無しで書ける。
 *
 * 併せて、クリックの横取り・保険のタイマー・Lenis の停止再開が全部要らなくなった。
 */
export function PageTransition() {
  const pathname = usePathname();

  useEffect(() => {
    /*
      捕捉フェーズで見るだけ。preventDefault はしない —— 遷移は next/link に任せる。
      印は**押した瞬間**に置く必要がある（React は commit のときに startViewTransition を
      呼ぶので、その時点で CSS が読める状態になっていないと間に合わない）。
    */
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor) return;
      if (anchor.dataset.morph === undefined) {
        delete document.documentElement.dataset.morph;
        return;
      }
      /* 一覧 ⇄ 商品ページ。720ms の bag morph が主役なので、地は静かに入れ替えるだけ。 */
      document.documentElement.dataset.morph = "";
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    /*
      印を落とす。遷移が始まった時点（pathname が動いた時点）から数えて、いちばん長い
      アニメーション（morph の 720ms）より後に消す。戻る / 進むはクリックを経由しないので、
      ここで落としておかないと前回の印が残って別の所作になる。
    */
    const id = window.setTimeout(() => {
      delete document.documentElement.dataset.morph;
    }, 1200);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
}
