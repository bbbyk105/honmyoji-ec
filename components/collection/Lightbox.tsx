"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/* ------------------------------------------------------------------
   写真を一枚で開く —— の入口。context・当たり判定・遅延読み込みだけを持つ。

   ビューア本体（倍率・掴み・つまみ・サムネイル）は `LightboxViewer.tsx` にあり、
   **押されるまで読み込まない**。商品ページを開いた人の大半は写真を開かないので、
   そのぶんを初回の JS に載せない。ただし初めて押したときに待たせないよう、
   ページが落ち着いたら（idle）先に取りに行っておく。
   ------------------------------------------------------------------ */

export type Shot = { src: string; alt: string; caption: string };

const LightboxViewer = dynamic(() => import("./LightboxViewer").then((m) => m.LightboxViewer), {
  ssr: false,
});

function preloadViewer() {
  void import("./LightboxViewer");
}

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
  const close = useCallback(() => setIndex(null), []);
  const value = useMemo(() => ({ open }), [open]);

  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(preloadViewer, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    /* Safari には requestIdleCallback が無い。 */
    const id = window.setTimeout(preloadViewer, 2000);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <LightboxCtx.Provider value={value}>
      {children}
      {index !== null ? <LightboxViewer shots={shots} index={index} onIndex={setIndex} onClose={close} /> : null}
    </LightboxCtx.Provider>
  );
}

/**
 * 押すと拡大表示が開く、透明な当たり判定。親の枠いっぱいに敷く（親は `relative`）。
 * Provider の外に置かれたら何も出さない —— `ProductHero` は Server Component で、
 * ヒーローだけ単体で置かれることもあるため。
 */
export function ZoomHit({
  index,
  label = "写真を拡大する",
  cursor,
  className = "",
}: {
  index: number;
  label?: string;
  /** `CursorMark` に灯す語。透明な button は形が無いので、語で押せると言う。 */
  cursor?: string;
  className?: string;
}) {
  const lightbox = useLightboxSafe();
  if (!lightbox) return null;
  return (
    <button
      type="button"
      onClick={() => lightbox.open(index)}
      aria-label={label}
      data-cursor={cursor}
      className={`absolute inset-0 cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-ivory/30 focus-visible:ring-offset-sumi ${className}`}
    />
  );
}

/**
 * 写真の上に透明な当たり判定を敷く。`Frame` は Server Component からも使うので、
 * onClick を生やすのではなく外から被せる。
 */
export function Zoomable({ index, children }: { index: number; children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ZoomHit index={index} cursor="Zoom" className="focus-visible:ring-offset-2" />
    </div>
  );
}
