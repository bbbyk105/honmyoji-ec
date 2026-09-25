"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";

import type { CartPiece } from "@/data/products";
import { addPiece, parseCart, removePiece, resolvePieces, samePiece } from "@/lib/cart";

/** 表示は Cart だが、キーは旧名のまま。変えると既存のカートが空になる。 */
const STORAGE_KEY = "miroku-held";

type CartContextValue = {
  slugs: string[];
  /** `slugs` をカタログで引いた品。MiniCart はこれを描く。 */
  pieces: CartPiece[];
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (slug: string) => void;
  remove: (slug: string) => void;
  has: (slug: string) => boolean;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const listeners = new Set<() => void>();
const EMPTY: string[] = [];

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

let cachedRaw: string | null = null;
let cached: string[] = EMPTY;

/** useSyncExternalStore の snapshot。中身が同じなら同じ配列を返す（返さないと無限に描き直す）。 */
function readHeld(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cached;
    cachedRaw = raw;
    cached = raw ? parseCart(raw) : EMPTY;
    return cached;
  } catch {
    cached = EMPTY;
    return cached;
  }
}

function writeHeld(next: string[]) {
  cached = next;
  cachedRaw = JSON.stringify(next);
  localStorage.setItem(STORAGE_KEY, cachedRaw);
  emit();
}

/**
 * カタログはサーバー（`SiteChrome`）から、カートが読む項目だけ（`CartPiece`）で受け取る。
 * 管理画面で直した価格とステータスがそのまま映り、物語や素材はブラウザに送らない。
 */
export function CartProvider({ catalog, children }: { catalog: CartPiece[]; children: ReactNode }) {
  const slugs = useSyncExternalStore(subscribe, readHeld, () => EMPTY);
  const [open, setOpen] = useState(false);

  const add = useCallback(
    (slug: string) => {
      const next = addPiece(readHeld(), catalog, slug);
      if (next) writeHeld(next);
    },
    [catalog],
  );

  const remove = useCallback((slug: string) => writeHeld(removePiece(readHeld(), catalog, slug)), [catalog]);

  const clear = useCallback(() => writeHeld([]), []);
  const has = useCallback((slug: string) => slugs.some((s) => samePiece(catalog, s, slug)), [catalog, slugs]);
  const pieces = useMemo(() => resolvePieces(catalog, slugs), [catalog, slugs]);

  const value = useMemo(
    () => ({ slugs, pieces, open, setOpen, add, remove, has, clear }),
    [slugs, pieces, open, add, remove, has, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
