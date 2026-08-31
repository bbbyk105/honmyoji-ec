"use client";

import Image from "next/image";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { startLenis, stopLenis } from "@/components/motion/SmoothScroll";

/* ------------------------------------------------------------------
   写真を一枚だけ大きく見る。

   地は ivory のまま。写真ビューアは黒く落とすのが定石だが、この店は
   「小さな展示カタログ」で、展示室は明るい —— 一枚だけ暗室に持っていくと、
   そこだけ別のサイトになる。写真を大きくして、周りの情報を減らすことで
   集中させる。

   拡大は倍率だけでなく、次の三つが揃って初めて使える道具になる。
     1. 見たい場所に寄れる（ホイールはカーソルの下を中心に拡大する）
     2. 掴んで動かせる。ただし画面の外へは逃げない
     3. どの一枚を見ているか分かり、隣へすぐ行ける（下のサムネイルと送り）
   ------------------------------------------------------------------ */

export type Shot = { src: string; alt: string; caption: string };

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const STEP = 0.5;

/** 等倍のとき、これ以上横に払ったら隣の写真へ送る（px）。 */
const SWIPE = 60;

type Ctx = { open: (index: number) => void };
const LightboxCtx = createContext<Ctx | null>(null);

export function useLightbox(): Ctx {
  const ctx = useContext(LightboxCtx);
  if (!ctx) throw new Error("useLightbox must be used within LightboxProvider");
  return ctx;
}

/** Provider の外でも壊れない版。ヒーローのように単体で置かれる部品が使う。 */
export function useLightboxSafe(): Ctx | null {
  return useContext(LightboxCtx);
}

export function LightboxProvider({ shots, children }: { shots: Shot[]; children: ReactNode }) {
  const [index, setIndex] = useState<number | null>(null);
  const open = useCallback((i: number) => setIndex(i), []);

  return (
    <LightboxCtx.Provider value={{ open }}>
      {children}
      {index !== null ? (
        <Viewer shots={shots} index={index} onIndex={setIndex} onClose={() => setIndex(null)} />
      ) : null}
    </LightboxCtx.Provider>
  );
}

/**
 * 写真の上に透明な当たり判定を敷く。`Frame` は Server Component からも使うので、
 * onClick を生やすのではなく外から被せる。
 */
export function Zoomable({ index, children }: { index: number; children: ReactNode }) {
  const { open } = useLightbox();
  return (
    <div className="relative">
      {children}
      <button
        type="button"
        onClick={() => open(index)}
        aria-label="写真を拡大する"
        className="absolute inset-0 cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
      />
    </div>
  );
}

function clampPan(
  pan: { x: number; y: number },
  zoom: number,
  rect: DOMRect | null,
): { x: number; y: number } {
  if (!rect || zoom <= MIN_ZOOM) return { x: 0, y: 0 };
  // 拡大して増えたぶんの半分までしか動かさない。これが無いと、少し払っただけで
  // 写真が画面の外へ出ていき、戻し方が分からなくなる。
  const maxX = (rect.width * (zoom - 1)) / 2;
  const maxY = (rect.height * (zoom - 1)) / 2;
  return {
    x: Math.max(-maxX, Math.min(maxX, pan.x)),
    y: Math.max(-maxY, Math.min(maxY, pan.y)),
  };
}

function Viewer({
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
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 });
  const [holding, setHolding] = useState(false);
  const { zoom } = view;

  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const shot = shots[index];
  const many = shots.length > 1;
  const zoomed = zoom > MIN_ZOOM;

  const reset = useCallback(() => setView({ zoom: 1, x: 0, y: 0 }), []);

  /**
   * ある一点を掴んだまま倍率を変える。
   *
   * 変換は `translate(pan) scale(zoom)`（原点は中央）なので、画面上の点 c に
   * 映っている画像の位置は `(c - pan) / zoom`。倍率を変えても同じ位置が c に
   * 残るよう pan を引き直す。中心固定で拡大すると、見たい場所が画面外へ逃げる。
   */
  const zoomAt = useCallback((next: number, clientX?: number, clientY?: number) => {
    const rect = stage.current?.getBoundingClientRect() ?? null;
    const target = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));

    setView((v) => {
      if (target <= MIN_ZOOM || !rect) return { zoom: target, x: 0, y: 0 };
      const cx = (clientX ?? rect.left + rect.width / 2) - rect.left - rect.width / 2;
      const cy = (clientY ?? rect.top + rect.height / 2) - rect.top - rect.height / 2;
      const ratio = target / v.zoom;
      const p = clampPan(
        { x: cx - (cx - v.x) * ratio, y: cy - (cy - v.y) * ratio },
        target,
        rect,
      );
      return { zoom: target, x: p.x, y: p.y };
    });
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
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    stopLenis();
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      startLenis();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "+" || e.key === "=") zoomAt(zoom + STEP);
      else if (e.key === "-") zoomAt(zoom - STEP);
      else if (e.key === "0") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose, reset, zoom, zoomAt]);

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
    setView((v) => {
      const p = clampPan(
        { x: d.panX + (e.clientX - d.x), y: d.panY + (e.clientY - d.y) },
        v.zoom,
        stage.current?.getBoundingClientRect() ?? null,
      );
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
    "flex items-center justify-center font-sans leading-none text-ink outline-none transition-colors hover:bg-ink hover:text-ivory focus-visible:ring-2 focus-visible:ring-ink/30 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink";

  const zoomBtn = `${press} h-11 w-11 text-[16px]`;

  const pager = `${press} h-11 w-11 border border-ink text-[17px]`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={shot.alt}
      className="fixed inset-0 z-[80] flex flex-col bg-ivory"
    >
      {/* 上 — どの一枚か、いま何倍か、閉じる */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-4 py-2 md:px-8">
        <p className="min-w-0 truncate font-sans text-[9.5px] uppercase tracking-[0.22em] text-mist">
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
            className={`${press} h-11 gap-2.5 border border-ink px-4 text-[11.5px] font-medium uppercase tracking-[0.2em] md:px-5`}
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
                aria-label={s.caption}
                aria-current={i === index ? "true" : undefined}
                className={`relative h-14 w-12 shrink-0 overflow-hidden bg-parchment outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-ink/30 ${
                  i === index ? "opacity-100" : "opacity-50 hover:opacity-85"
                }`}
              >
                <Image src={s.src} alt="" fill sizes="48px" className="object-cover" />
                {i === index ? (
                  <span aria-hidden className="absolute inset-0 border border-ink" />
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
              <span className="font-medium text-ink">{String(index + 1).padStart(2, "0")}</span>
              <span className="text-mist"> / {String(shots.length).padStart(2, "0")}</span>
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
