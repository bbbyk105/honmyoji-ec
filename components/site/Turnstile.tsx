"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------
   人が送っているかの確認（Cloudflare Turnstile）。公開フォームの中に置くと、Cloudflare が
   確かめて印（token）を `cf-turnstile-response` という隠し欄に入れ、フォームと一緒に届く。
   照合はサーバー側（lib/turnstile.ts）。

   ダッシュボードのウィジェットは「管理」モード（2026-10-15）: ほとんどの人は何もせずに通り、
   怪しい相手にだけチェックボックスが出る。枠はいつも見えている（「操作が要るときだけ出す」に
   すると、出た瞬間に送信ボタンが押し下げられる）。

   スクリプトはこの部品を置いたページでだけ読む（全ページの初回 JS に載せない）。
   ------------------------------------------------------------------ */

/**
 * サイトキー（公開してよい値）。ウィジェットは honmyoujifuji.com でしか動かないので、
 * 手元では Cloudflare の試験用のキー（必ず通る）を使う。対になる試験用の秘密は lib/turnstile.ts。
 */
const SITE_KEY = process.env.NODE_ENV === "production" ? "0x4AAAAAAFW26-7x_qDyJ-bm" : "1x00000000000000000000AA";

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/**
 * 枠の幅。標準（normal）は 300px 固定。flexible にするとフォームの幅いっぱいの白い帯になり、
 * 紙の面の上で一番重いものになった。300px に入らない画面では縦長の compact にする。
 */
const NORMAL_WIDTH = 300;

type TurnstileApi = {
  render(container: HTMLElement, options: Record<string, unknown>): string | null | undefined;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type Props = {
  /** どのフォームの印か。サーバーが照合のときに同じ値かを見る（別のフォームの印を使い回させない） */
  action: string;
  /**
   * 変わるたびに新しい印を取り直す。印は一度しか使えないので、送って断られたあとは
   * 取り直さないと次の送信も断られる。フォームの state をそのまま渡す。
   */
  resetKey?: unknown;
};

export function Turnstile({ action, resetKey }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);

  // スクリプトを読み終えたとき（と、読み終えたあとで部品が置き直されたとき）に枠を描く
  function mount() {
    const api = window.turnstile;
    const el = box.current;
    if (!api || !el || widget.current) return;
    widget.current =
      api.render(el, {
        sitekey: SITE_KEY,
        action,
        theme: "light", // お問い合わせは紙の面
        size: el.clientWidth < NORMAL_WIDTH ? "compact" : "normal",
      }) ?? null;
  }

  useEffect(
    () => () => {
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    },
    [],
  );

  const firstKey = useRef(true);
  useEffect(() => {
    if (firstKey.current) {
      firstKey.current = false;
      return;
    }
    if (widget.current) window.turnstile?.reset(widget.current);
  }, [resetKey]);

  return (
    <>
      <Script src={SCRIPT} strategy="afterInteractive" onReady={mount} />
      <div ref={box} />
    </>
  );
}
