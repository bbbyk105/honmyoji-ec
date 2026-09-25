"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { useScrollLock } from "@/hooks/useScrollLock";
import { useWindowEvent } from "@/hooks/useWindowEvent";
import { twoDigits } from "@/lib/format";
import { INITIAL_VIEW, MAX_ZOOM, MIN_ZOOM, clampPan, zoomAround } from "@/lib/pan-zoom";
import type { Shot } from "./Lightbox";

/* ------------------------------------------------------------------
   写真を一枚だけ大きく見る —— の本体。`Lightbox.tsx` が**押されてから**読み込む
   （`next/dynamic`）。倍率・掴み・つまみの処理は、写真を開かない人には要らない。

   地はサイトと同じ sumi。ビューアだけ別の明るさに振らない —— 一枚だけ違う部屋に
   持っていくと、そこだけ別のサイトになる（以前は逆向きに同じ理由で ivory だった）。
   集中は明るさではなく、周りの情報を減らすこと（キャプションと倍率と送りだけ）で作る。

   拡大は倍率だけでなく、次の三つが揃って初めて使える道具になる。
     1. 見たい場所に寄れる（ホイールはカーソルの下を中心に拡大する）
     2. 掴んで動かせる。ただし画面の外へは逃げない
     3. どの一枚を見ているか分かり、隣へすぐ行ける（下のサムネイルと送り）
   ------------------------------------------------------------------ */

const STEP = 0.5;

/** 等倍のとき、これ以上横に払ったら隣の写真へ送る（px）。 */
const SWIPE = 60;

export function LightboxViewer({
  shots,
  index,
  onIndex,
  onClose,
}: {
  shots: Shot[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  /* 倍率と位置は一つの state に持つ。別々にすると、倍率の updater の中から
     位置の setState を呼ぶことになり、React が updater を二度走らせる開発時に
     位置だけ二重に適用されて、掴んだ点からずれる。 */
  const [view, setView] = useState(INITIAL_VIEW);
  const [holding, setHolding] = useState(false);
  const { zoom } = view;

  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const shot = shots[index];
  const many = shots.length > 1;
  const zoomed = zoom > MIN_ZOOM;

  const reset = useCallback(() => setView(INITIAL_VIEW), []);

  /** ある一点を掴んだまま倍率を変える（計算は `lib/pan-zoom.ts` の `zoomAround`）。 */
  const zoomAt = useCallback((next: number, clientX?: number, clientY?: number) => {
    /* 矩形は updater の外で読む。updater は純粋に保つ。 */
    const rect = stage.current?.getBoundingClientRect() ?? null;
    setView((v) => zoomAround(v, next, rect, clientX, clientY));
  }, []);

  const go = useCallback(
    (delta: number) => {
      if (!many) return;
      reset();
      onIndex((index + delta + shots.length) % shots.length);
    },
    [index, many, onIndex, reset, shots.length],
  );

  // 背後のページは動かさない。Lenis もカートと同じ扱いで止める。
  useScrollLock(true);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useWindowEvent("keydown", (e) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "+" || e.key === "=") zoomAt(zoom + STEP);
    else if (e.key === "-") zoomAt(zoom - STEP);
    else if (e.key === "0") reset();
  });

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoomAt(zoom + (e.deltaY > 0 ? -STEP : STEP), e.clientX, e.clientY);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, panX: view.x, panY: view.y };
    if (zoomed) setHolding(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !zoomed) return; // 等倍のときは動かさない（払えば隣の写真へ）
    const rect = stage.current?.getBoundingClientRect() ?? null;
    setView((v) => {
      const p = clampPan({ x: d.panX + (e.clientX - d.x), y: d.panY + (e.clientY - d.y) }, v.zoom, rect);
      return { zoom: v.zoom, x: p.x, y: p.y };
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    setHolding(false);
    if (!d) return;

    // 等倍のまま横に払ったら隣へ。拡大中は掴んで動かす操作なので送らない。
    if (!zoomed && many) {
      const dx = e.clientX - d.x;
      if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(e.clientY - d.y)) go(dx < 0 ? 1 : -1);
    }
  };

  const distanceOf = (touches: React.TouchList) =>
    Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinch.current = { distance: distanceOf(e.touches), zoom };
      setHolding(true);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const p = pinch.current;
    if (!p || e.touches.length !== 2) return;
    const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    zoomAt((p.zoom * distanceOf(e.touches)) / p.distance, midX, midY);
  };

  const onTouchEnd = () => {
    pinch.current = null;
    setHolding(false);
  };

  if (!shot) return null;

  /* 罫は「常に」引く。hover で初めて出る罫は、触るまで押せると分からない
     （Button.tsx と同じ判断）。色も mist ではなく ink —— 操作は本文ではない。 */
  const press =
    "flex items-center justify-center font-sans leading-none text-ivory outline-none transition-colors hover:bg-ivory hover:text-sumi focus-visible:ring-2 focus-visible:ring-ivory/30 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ivory";

  const zoomBtn = `${press} h-11 w-11 text-[16px]`;

  const pager = `${press} h-11 w-11 border border-ivory text-[17px]`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={shot.alt}
      className="fixed inset-0 z-[80] flex flex-col bg-sumi"
    >
      {/* 上 — どの一枚か、いま何倍か、閉じる */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-4 py-2 md:px-8">
        <p className="min-w-0 truncate font-display text-[17px] font-light leading-none text-ivory">
          {shot.caption}
        </p>

        <div className="flex shrink-0 items-center gap-3">
          {/* 倍率は三つでひと組。スマホは指でつまめるので出さない（Close の場所を空ける） */}
          <div className="hidden items-center border border-line sm:flex">
            <button
              type="button"
              onClick={() => zoomAt(zoom - STEP)}
              disabled={!zoomed}
              aria-label="縮小"
              className={zoomBtn}
            >
              −
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={!zoomed}
              aria-label="等倍に戻す"
              className={`${press} h-11 w-[72px] border-x border-line text-[11px] font-medium tracking-[0.14em] tabular-nums`}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => zoomAt(zoom + STEP)}
              disabled={zoom >= MAX_ZOOM}
              aria-label="拡大"
              className={zoomBtn}
            >
              ＋
            </button>
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className={`${press} h-11 gap-2.5 border border-ivory px-4 text-[11.5px] font-medium uppercase tracking-[0.2em] md:px-5`}
          >
            <span aria-hidden className="text-[15px]">
              ✕
            </span>
            Close
          </button>
        </div>
      </div>

      {/* 中 — 写真。掴んで動かす／つまんで拡大する */}
      <div
        ref={stage}
        className="relative flex-1 touch-none select-none overflow-hidden"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDoubleClick={(e) => (zoomed ? reset() : zoomAt(2.5, e.clientX, e.clientY))}
        style={{ cursor: zoomed ? (holding ? "grabbing" : "grab") : "zoom-in" }}
      >
        <div
          className="absolute inset-0 motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
            transitionDuration: holding ? "0ms" : undefined,
          }}
        >
          <Image
            key={shot.src}
            src={shot.src}
            alt={shot.alt}
            fill
            sizes="100vw"
            priority
            className="object-contain p-3 md:p-6"
            draggable={false}
          />
        </div>
      </div>

      {/* 下 — 何枚あって、いまどれか。押せば直接そこへ */}
      {many ? (
        <div className="flex shrink-0 items-center justify-between gap-5 border-t border-line px-4 py-2.5 md:px-8">
          <div className="flex min-w-0 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {shots.map((s, i) => (
              <button
                key={s.src}
                type="button"
                onClick={() => {
                  reset();
                  onIndex(i);
                }}
                aria-label={s.alt}
                aria-current={i === index ? "true" : undefined}
                className={`relative h-14 w-12 shrink-0 overflow-hidden bg-sumi outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-ivory/30 ${
                  i === index ? "opacity-100" : "opacity-50 hover:opacity-85"
                }`}
              >
                <Image src={s.src} alt="" fill sizes="48px" className="object-cover" />
                {i === index ? (
                  <span aria-hidden className="absolute inset-0 border border-ivory" />
                ) : null}
              </button>
            ))}
          </div>
          {/* 送りはここだけ。写真の上に矢印を浮かせると、拡大・移動のために
              stage が pointer capture を取るので押しても反応しない。 */}
          <div className="flex shrink-0 items-center gap-1.5">
            <button type="button" onClick={() => go(-1)} aria-label="前の写真" className={pager}>
              ←
            </button>
            <p className="w-[74px] text-center font-sans text-[12px] tabular-nums tracking-[0.16em]">
              <span className="font-medium text-ivory">{twoDigits(index + 1)}</span>
              <span className="text-mist"> / {twoDigits(shots.length)}</span>
            </p>
            <button type="button" onClick={() => go(1)} aria-label="次の写真" className={pager}>
              →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
