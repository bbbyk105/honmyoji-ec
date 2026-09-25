"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { isPurchasable, leadSrc, priceLabel, productPath, aud } from "@/data/products";
import { startCheckout, type CheckoutState } from "@/app/(site)/checkout/actions";
import { Arrow } from "@/components/site/Arrow";
import { Button } from "@/components/site/Button";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useWindowEvent } from "@/hooks/useWindowEvent";
import { useCart } from "./CartProvider";

/**
 * 品は `useCart().pieces` から読む。カタログは `SiteChrome` が DB を重ねてから
 * `CartProvider` に渡しているので、管理画面で価格を直した直後でも見えている数字が
 * 請求額と食い違わない（data/products.ts を直接読むと古い値が出る）。
 */
/** 塗りの主導線。`Button` の solid と同じ寸法（form の submit と Link で使うので素のクラスで持つ）。 */
const SOLID =
  "cta caps inline-flex min-h-[52px] w-full items-center justify-center gap-5 border border-ivory bg-ivory px-8 text-sumi no-underline transition-[background-color,opacity] duration-500 hover:bg-ivory/88 disabled:opacity-50";
const QUIET =
  "min-h-11 w-fit font-sans text-meta text-mist underline decoration-mist/40 underline-offset-4 transition-colors duration-500 hover:text-ivory hover:decoration-ivory";

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
        className={`absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col border-l border-line bg-sumi transition-transform duration-700 ease-[var(--ease-soft)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-7 py-6">
          <p className="font-display text-[30px] font-light leading-none text-ivory">Cart</p>
          <button type="button" onClick={() => setOpen(false)} className="caps link-line min-h-11 text-ivory">
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-8">
          {pieces.length === 0 ? (
            <p className="max-w-[30ch] font-sans text-small text-bone">
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
                      <span lang="ja" className="ml-2.5 font-jp text-[13px] tracking-[0.04em] text-mist">{p.kanji}</span>
                    </Link>
                    <p className="mt-2 font-sans text-meta tabular-nums text-bone">
                      {priceLabel(p) ?? "Price to come"}
                    </p>
                    {!isPurchasable(p) ? (
                      <p className="mt-1 font-sans text-meta text-clay">No longer available</p>
                    ) : null}
                    <button type="button" onClick={() => remove(p.slug)} className={`mt-1 ${QUIET}`}>
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
              <span className="font-sans text-meta text-mist">Subtotal</span>
              <span className="font-display text-[22px] font-light leading-none tabular-nums text-ivory">{aud.format(total)}</span>
            </div>
          ) : null}

          <p className="font-sans text-meta text-mist">
            {canCheckout
              ? "Shipping is added at the next step. Payment is handled by Stripe — we never see your card."
              : "Nothing is charged here. Send us your cart and a person writes back with payment details."}
          </p>

          {state.error ? (
            <p role="alert" className="mt-4 font-sans text-meta text-clay">
              {state.error}
            </p>
          ) : null}

          {pieces.length > 0 ? (
            <div className="mt-5 flex flex-col gap-4">
              {canCheckout ? (
                <>
                  <form action={checkout}>
                    <input type="hidden" name="slugs" value={query} />
                    <button type="submit" disabled={pending || sold.length > 0} className={SOLID}>
                      {pending ? "Opening checkout" : "Check out"}
                      <Arrow className="cta-arrow" />
                    </button>
                  </form>
                  <Link
                    href={`/contact?product=${query}&subject=reserve`}
                    onClick={() => setOpen(false)}
                    className="cta caps link-cta inline-flex min-h-11 w-fit items-center gap-7 self-center text-ivory no-underline"
                  >
                    <span className="cta-label">Ask about these</span>
                    <Arrow className="cta-arrow" />
                  </Link>
                </>
              ) : (
                <Link
                  href={`/contact?product=${query}&subject=reserve`}
                  onClick={() => setOpen(false)}
                  className={SOLID}
                >
                  Send this cart
                  <Arrow className="cta-arrow" />
                </Link>
              )}
              <button type="button" onClick={clear} className={`self-center ${QUIET}`}>
                Clear all
              </button>
            </div>
          ) : (
            <Button href="/collection" className="mt-5">
              View the collection
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}
