"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { isPurchasable, leadSrc, priceLabel, productPath, aud } from "@/data/products";
import { startCheckout, type CheckoutState } from "@/app/(site)/checkout/actions";
import { Button } from "@/components/site/Button";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useWindowEvent } from "@/hooks/useWindowEvent";
import { useCart } from "./CartProvider";

/**
 * 品は `useCart().pieces` から読む。カタログは `SiteChrome` が DB を重ねてから
 * `CartProvider` に渡しているので、管理画面で価格を直した直後でも見えている数字が
 * 請求額と食い違わない（data/products.ts を直接読むと古い値が出る）。
 */
export function MiniCart({ canCheckout }: { canCheckout: boolean }) {
  const { pieces, open, setOpen, remove, clear } = useCart();
  const [state, checkout, pending] = useActionState<CheckoutState, FormData>(startCheckout, {});

  const query = pieces.map((p) => p.slug).join(",");
  const sold = pieces.filter((p) => !isPurchasable(p));

  useScrollLock(open);
  useWindowEvent(
    "keydown",
    (e) => {
      if (e.key === "Escape") setOpen(false);
    },
    { enabled: open },
  );

  const total = pieces.reduce((sum, p) => sum + (p.priceAud ?? 0), 0);

  return (
    <div
      className={`fixed inset-0 z-[60] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close cart"
        onClick={() => setOpen(false)}
        className={`absolute inset-0 bg-sumi/70 transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
        inert={!open}
        className={`absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-sumi shadow-[-24px_0_60px_rgba(0,0,0,0.55)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-baseline justify-between border-b border-line px-7 py-6">
          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-mist">Reserve</p>
            <p className="mt-2 font-display text-[28px] font-light leading-none text-ivory">Cart</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="font-sans text-[10px] uppercase tracking-[0.28em] text-ivory"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-8">
          {pieces.length === 0 ? (
            <p className="max-w-[28ch] font-sans text-[13px] leading-[1.9] text-bone/80">
              Your cart is empty. Add a piece from the collection, then take it to checkout — or
              write to us first if you would rather ask.
            </p>
          ) : (
            <ul className="space-y-8">
              {pieces.map((p) => (
                <li key={p.slug} className="flex gap-5">
                  <Link
                    href={productPath(p)}
                    onClick={() => setOpen(false)}
                    className="relative block h-20 w-16 shrink-0 overflow-hidden bg-sumi"
                  >
                    <Image
                      src={leadSrc(p.folder)}
                      alt={p.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <Link
                      href={productPath(p)}
                      onClick={() => setOpen(false)}
                      className="font-display text-[22px] font-light leading-none text-ivory no-underline"
                    >
                      {p.name}
                      <span className="ml-2 font-jp text-[11px] tracking-[0.2em] text-mist">{p.kanji}</span>
                    </Link>
                    <p className="mt-1.5 font-sans text-[12px] tracking-[0.12em] text-bone/80">
                      {priceLabel(p) ?? "Price to come"}
                    </p>
                    {!isPurchasable(p) ? (
                      <p className="mt-1.5 font-sans text-[11px] tracking-[0.14em] text-clay">
                        No longer available
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => remove(p.slug)}
                      className="mt-3 min-h-9 w-fit font-sans text-[10px] uppercase tracking-[0.2em] text-mist underline decoration-mist/40 underline-offset-4 transition-colors hover:text-ivory hover:decoration-ivory"
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
          {pieces.length > 0 && canCheckout ? (
            <div className="mb-5 flex items-baseline justify-between border-b border-line pb-4">
              <span className="font-sans text-[10.5px] uppercase tracking-[0.22em] text-mist">
                Subtotal
              </span>
              <span className="font-sans text-[15px] tabular-nums text-ivory">{aud.format(total)}</span>
            </div>
          ) : null}

          <p className="font-sans text-[11px] leading-[1.8] text-mist">
            {canCheckout
              ? "Shipping is added at the next step. Payment is handled by Stripe — we never see your card."
              : "Nothing is charged here. Send us your cart and a person writes back with payment details."}
          </p>

          {state.error ? (
            <p role="alert" className="mt-4 font-sans text-[12px] leading-[1.7] text-clay">
              {state.error}
            </p>
          ) : null}

          {pieces.length > 0 ? (
            <div className="mt-5 flex flex-col gap-4">
              {canCheckout ? (
                <>
                  <form action={checkout}>
                    <input type="hidden" name="slugs" value={query} />
                    <button
                      type="submit"
                      disabled={pending || sold.length > 0}
                      className="cta inline-flex min-h-12 w-full items-center justify-center gap-3 border border-ivory bg-ivory px-6 py-3.5 font-sans text-[11.5px] font-medium uppercase tracking-[0.2em] text-sumi transition-colors duration-300 hover:border-bone hover:bg-bone disabled:opacity-55"
                    >
                      {pending ? "Opening checkout" : "Check out"}
                      <span aria-hidden className="cta-arrow text-[1.15em] leading-none">
                        →
                      </span>
                    </button>
                  </form>
                  <Link
                    href={`/contact?product=${query}&subject=reserve`}
                    onClick={() => setOpen(false)}
                    className="cta inline-flex min-h-11 items-center justify-center gap-3 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-ivory no-underline link-cta"
                  >
                    Ask about these
                    <span aria-hidden className="cta-arrow text-[1.15em] leading-none">
                      →
                    </span>
                  </Link>
                </>
              ) : (
                <Link
                  href={`/contact?product=${query}&subject=reserve`}
                  onClick={() => setOpen(false)}
                  className="cta inline-flex min-h-12 items-center justify-center gap-3 border border-ivory bg-ivory px-6 py-3.5 font-sans text-[11.5px] font-medium uppercase tracking-[0.2em] text-sumi no-underline transition-colors duration-300 hover:border-bone hover:bg-bone"
                >
                  Send this cart
                  <span aria-hidden className="cta-arrow text-[1.15em] leading-none">
                    →
                  </span>
                </Link>
              )}
              <button
                type="button"
                onClick={clear}
                className="min-h-11 font-sans text-[10.5px] uppercase tracking-[0.2em] text-mist underline decoration-mist/40 underline-offset-4 transition-colors hover:text-ivory hover:decoration-ivory"
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
