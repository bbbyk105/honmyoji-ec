"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { getProduct, productCutout, productPath, aud } from "@/data/products";
import { PieceSlug } from "@/components/collection/PieceSlug";
import { startLenis, stopLenis } from "@/components/motion/SmoothScroll";
import { Button } from "@/components/site/Button";
import { useCart } from "./CartProvider";

export function MiniCart() {
  const { slugs, open, setOpen, remove, clear } = useCart();
  const pieces = slugs.map((s) => getProduct(s)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const query = pieces.map((p) => p.slug).join(",");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    stopLenis();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      startLenis();
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  return (
    <div
      className={`fixed inset-0 z-[60] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close cart"
        onClick={() => setOpen(false)}
        className={`absolute inset-0 bg-ink/20 transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
        inert={!open}
        className={`absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-ivory shadow-[-24px_0_60px_rgba(26,23,20,0.08)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-baseline justify-between border-b border-line px-7 py-6">
          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-mist">Reserve</p>
            <p className="mt-2 font-display text-[28px] font-light leading-none text-ink">Cart</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="font-sans text-[10px] uppercase tracking-[0.28em] text-ink"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-8">
          {pieces.length === 0 ? (
            <p className="max-w-[28ch] font-sans text-[13px] leading-[1.9] text-charcoal/80">
              Your cart is empty. Add a piece from the collection, then send the cart to us — we write back with payment details.
            </p>
          ) : (
            <ul className="space-y-8">
              {pieces.map((p) => (
                <li key={p.slug} className="flex gap-5">
                  <Link
                    href={productPath(p)}
                    onClick={() => setOpen(false)}
                    className="relative block h-24 w-16 shrink-0"
                  >
                    <Image
                      src={productCutout(p.slug)}
                      alt={p.name}
                      fill
                      sizes="64px"
                      className="object-contain object-bottom"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <Link
                      href={productPath(p)}
                      onClick={() => setOpen(false)}
                      className="font-display text-[22px] font-light leading-none text-ink no-underline"
                    >
                      {p.name}
                      <span className="ml-2 font-jp text-[11px] tracking-[0.2em] text-mist">{p.kanji}</span>
                    </Link>
                    <PieceSlug product={p} className="mt-2" />
                    <p className="mt-1.5 font-sans text-[12px] tracking-[0.12em] text-charcoal/80">
                      {aud.format(p.priceAud)}
                    </p>
                    <button
                      type="button"
                      onClick={() => remove(p.slug)}
                      className="mt-3 min-h-9 w-fit font-sans text-[10px] uppercase tracking-[0.2em] text-mist underline decoration-mist/40 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-line px-7 py-7">
          <p className="font-sans text-[11px] leading-[1.8] text-mist">
            Nothing is charged here. Send us your cart and a person writes back with payment details.
          </p>
          {pieces.length > 0 ? (
            <div className="mt-5 flex flex-col gap-4">
              <Link
                href={`/contact?product=${query}&subject=reserve`}
                onClick={() => setOpen(false)}
                className="cta inline-flex min-h-12 items-center justify-center gap-3 border border-ink bg-ink px-6 py-3.5 font-sans text-[11.5px] font-medium uppercase tracking-[0.2em] text-ivory no-underline transition-colors duration-300 hover:border-charcoal hover:bg-charcoal"
              >
                Send this cart
                <span aria-hidden className="cta-arrow text-[1.15em] leading-none">
                  →
                </span>
              </Link>
              <button
                type="button"
                onClick={clear}
                className="min-h-11 font-sans text-[10.5px] uppercase tracking-[0.2em] text-mist underline decoration-mist/40 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
              >
                Clear all
              </button>
            </div>
          ) : (
            <Button href="/collection" variant="outline" className="mt-5 w-full">
              View the collection
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}
