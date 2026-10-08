import { useSyncExternalStore } from "react";

import { langFromLanguages, type Lang } from "@/lib/lang";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("languagechange", onChange);
  return () => window.removeEventListener("languagechange", onChange);
}

const read = (): Lang => langFromLanguages(navigator.languages);

/**
 * ブラウザの言語（`lib/lang.ts`）。作り置きのページに載る部品（カート）が使う。
 *
 * サーバーは英語（サイトの主の言語）で描き、ブラウザに渡ってから設定の言語に切り替わる。
 * カートは閉じた状態で描かれるので、切り替わる瞬間は見えない。
 */
export function useBrowserLang(): Lang {
  return useSyncExternalStore(subscribe, read, () => "en");
}
