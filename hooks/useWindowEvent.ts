import { useEffect, useEffectEvent } from "react";

type Options = {
  /** false の間は登録しない（カートが閉じている間の Esc など）。 */
  enabled?: boolean;
  passive?: boolean;
};

/**
 * window のイベントを effect で付けて、外す。
 *
 * handler は描画ごとに新しい関数でよい —— `useEffectEvent` が最新の handler を読むので、
 * state が変わるたびに付け直さない（以前のビューアは倍率が変わるたびに keydown を
 * 付け直していた）。付け直すのは `type` と `enabled` が変わったときだけ。
 *
 * メニュー・カート・ビューアの Esc と、SmoothScroll の popstate がこれを使う。
 */
export function useWindowEvent<K extends keyof WindowEventMap>(
  type: K,
  handler: (event: WindowEventMap[K]) => void,
  { enabled = true, passive }: Options = {},
) {
  const onEvent = useEffectEvent(handler);

  useEffect(() => {
    if (!enabled) return;
    const listener = (event: WindowEventMap[K]) => onEvent(event);
    window.addEventListener(type, listener, { passive });
    return () => window.removeEventListener(type, listener);
  }, [type, enabled, passive]);
}
