"use client";

import { useEffect, useRef, useState } from "react";

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
 * 手元で `next build && next start` すると本番のキーになり、localhost では枠が動かない。
 */
const SITE_KEY = process.env.NODE_ENV === "production" ? "0x4AAAAAAFW26-7x_qDyJ-bm" : "1x00000000000000000000AA";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

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

/**
 * スクリプトを一度だけ読む。読み込みの状態はモジュールに持たず、window と DOM に聞く ——
 * 読み込み中にページを離れて戻ったときも、StrictMode で付け外されたときも、その時に置かれて
 * いる部品が待てる（next/script の onReady はどちらの場合も呼ばれず、枠が出なかった）。
 * 読めなかった <script> は外す（次に置かれたときに読み直せるように）。
 */
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  return new Promise((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
    const el = script;
    el.addEventListener(
      "load",
      () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile is missing"))),
      { once: true },
    );
    el.addEventListener(
      "error",
      () => {
        el.remove();
        reject(new Error("turnstile script failed"));
      },
      { once: true },
    );
  });
}

type Props = {
  /** どのフォームの印か。サーバーが照合のときに同じ値かを見る（別のフォームの印を使い回させない） */
  action: string;
  /** 確認が動かないときに案内する宛先（直接のメールなら届く） */
  email: string;
  /**
   * **null 以外の値に変わったときだけ**印を取り直す。印は一度しか使えないので、サーバーが印を
   * 使ったあとで断ったときは取り直さないと次も断られる。逆に、印を使う前に断ったとき（入力漏れ）は
   * null を渡す —— 取り直すと、怪しいと判定された人にはチェックボックスがまた出て、直してすぐ
   * 送ると印が空になる。
   */
  resetKey?: unknown;
};

export function Turnstile({ action, email, resetKey }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  // スクリプトが読めない・枠がエラーを返した・対応していないブラウザ。送っても必ず断られるので、先に言う
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let id: string | null = null;

    loadTurnstile().then(
      (api) => {
        const el = box.current;
        if (cancelled || !el) return;
        id =
          api.render(el, {
            sitekey: SITE_KEY,
            action,
            theme: "light", // お問い合わせは紙の面
            size: el.clientWidth < NORMAL_WIDTH ? "compact" : "normal",
            callback: () => setUnavailable(false),
            "error-callback": () => setUnavailable(true), // Cloudflare が自分でやり直し、通れば callback が消す
            "unsupported-callback": () => setUnavailable(true),
          }) ?? null;
        widget.current = id;
      },
      () => {
        if (!cancelled) setUnavailable(true);
      },
    );

    return () => {
      cancelled = true;
      if (id) window.turnstile?.remove(id);
      if (widget.current === id) widget.current = null;
    };
  }, [action]);

  useEffect(() => {
    if (resetKey == null || !widget.current) return;
    window.turnstile?.reset(widget.current);
  }, [resetKey]);

  return (
    <div>
      <div ref={box} />
      {unavailable ? (
        <p role="status" className="mt-3 max-w-[44ch] font-sans text-meta text-clay">
          The check that keeps out spam could not load, so this form cannot send right now. Please email us
          directly at{" "}
          <a href={`mailto:${email}`} className="link-line">
            {email}
          </a>
          .
        </p>
      ) : null}
    </div>
  );
}
