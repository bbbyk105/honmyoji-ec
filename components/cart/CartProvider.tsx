"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { getProduct } from "@/data/products";

const STORAGE_KEY = "miroku-held";

type CartContextValue = {
  slugs: string[];
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

function readHeld(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cached;
    cachedRaw = raw;
    if (!raw) {
      cached = EMPTY;
      return cached;
    }
    const parsed = JSON.parse(raw) as unknown;
    cached = Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : EMPTY;
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

function samePiece(stored: string, key: string) {
  if (stored === key) return true;
  const a = getProduct(stored);
  const b = getProduct(key);
  return Boolean(a && b && a.slug === b.slug);
}

function canonicalSlug(key: string) {
  return getProduct(key)?.slug ?? key;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const slugs = useSyncExternalStore(subscribe, readHeld, () => EMPTY);
  const [open, setOpen] = useState(false);

  const add = useCallback((slug: string) => {
    const current = readHeld();
    const next = canonicalSlug(slug);
    if (current.some((s) => samePiece(s, next))) return;
    writeHeld([...current, next]);
  }, []);

  const remove = useCallback((slug: string) => {
    writeHeld(readHeld().filter((s) => !samePiece(s, slug)));
  }, []);

  const clear = useCallback(() => writeHeld([]), []);
  const has = useCallback((slug: string) => slugs.some((s) => samePiece(s, slug)), [slugs]);

  const value = useMemo(
    () => ({ slugs, open, setOpen, add, remove, has, clear }),
    [slugs, open, add, remove, has, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
