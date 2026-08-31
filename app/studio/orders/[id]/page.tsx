import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "@/app/studio/options";
import { STUDIO_HEAD, STUDIO_SHELL } from "@/components/studio/shell";
import { aud, productCutout } from "@/data/products";
import { getPieces } from "@/lib/catalog";
import { getOrder, orderAmount, orderRef } from "@/lib/orders";
import { requireSession } from "@/lib/studio-session";
import { OrderForm } from "./OrderForm";

export const dynamic = "force-dynamic";

function fullDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function StudioOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();

  const { id } = await params;
  const numeric = Number(id);
  if (!Number.isInteger(numeric)) notFound();

  const order = await getOrder(numeric);
  if (!order) notFound();

  const pieces = await getPieces(order.slugs);
  const address = order.shipping;

  return (
    <div className={STUDIO_SHELL}>
      <div className={STUDIO_HEAD}>
        <Link
          href="/studio/orders"
          className="font-sans text-[10.5px] font-medium uppercase tracking-[0.22em] text-mist no-underline transition-colors hover:text-ink"
        >
          ← 注文一覧
        </Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div>
            <h1 className="font-display text-[clamp(30px,4vw,42px)] font-light leading-[1.02] text-ink">
              {orderRef(order.id)}
            </h1>
            <p className="mt-2.5 flex items-center gap-2.5 font-sans text-[12.5px] text-mist">
              <span aria-hidden className={`h-1.5 w-1.5 ${ORDER_STATUS_COLOR[order.status]}`} />
              {ORDER_STATUS_LABEL[order.status]} · {fullDate(order.created_at)}
            </p>
          </div>
          <p className="font-display text-[30px] font-light tabular-nums text-ink">
            {orderAmount(order)}
          </p>
        </div>
      </div>

      <div className="grid gap-x-16 gap-y-12 pb-24 pt-11 lg:grid-cols-[1fr_320px]">
        <OrderForm order={order} />

        <aside className="space-y-8 lg:pt-1">
          <section>
            <h2 className="eyebrow border-b border-line pb-3">品</h2>
            <ul className="mt-4 space-y-4">
              {pieces.length === 0 ? (
                <li className="font-sans text-[13px] text-mist">
                  {order.slugs.join(" · ") || "—"}
                </li>
              ) : (
                pieces.map((piece) => (
                  <li key={piece.slug} className="flex items-center gap-4">
                    <div className="relative h-11 w-11 shrink-0 bg-parchment">
                      <Image
                        src={productCutout(piece.folder)}
                        alt=""
                        fill
                        sizes="44px"
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/studio/pieces/${piece.slug}`}
                        className="font-display text-[18px] font-light text-ink no-underline hover:text-charcoal"
                      >
                        {piece.name}
                      </Link>
                      <p className="font-sans text-[12px] text-mist">{piece.sku}</p>
                    </div>
                    <p className="ml-auto font-sans text-[13px] tabular-nums text-charcoal">
                      {aud.format(piece.priceAud)}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <h2 className="eyebrow border-b border-line pb-3">送り先</h2>
            {address ? (
              <address className="mt-4 font-sans text-[13.5px] not-italic leading-[1.9] text-charcoal">
                {address.name ?? order.customer_name}
                <br />
                {address.line1}
                {address.line2 ? (
                  <>
                    <br />
                    {address.line2}
                  </>
                ) : null}
                <br />
                {[address.city, address.state, address.postal_code].filter(Boolean).join(" ")}
                <br />
                {address.country}
                {address.phone ? (
                  <>
                    <br />
                    <span className="tabular-nums">{address.phone}</span>
                  </>
                ) : null}
              </address>
            ) : (
              <p className="mt-4 font-sans text-[13px] text-mist">
                住所が届いていません。Stripe の Checkout で住所の取得を有効にしてください。
              </p>
            )}

            {order.customer_email ? (
              <p className="mt-4 font-sans text-[13px] leading-[1.8]">
                <a
                  href={`mailto:${order.customer_email}`}
                  className="text-charcoal underline decoration-line underline-offset-[5px] transition-colors hover:decoration-ink"
                >
                  {order.customer_email}
                </a>
              </p>
            ) : null}
          </section>

          <section>
            <h2 className="eyebrow border-b border-line pb-3">Stripe</h2>
            <dl className="mt-4 space-y-2.5 font-sans text-[12.5px] leading-[1.6]">
              <div>
                <dt className="text-mist">Payment intent</dt>
                <dd className="mt-1 break-all font-mono text-[11.5px] text-charcoal">
                  {order.stripe_intent ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-mist">発送日</dt>
                <dd className="mt-1 text-charcoal">{fullDate(order.shipped_at)}</dd>
              </div>
            </dl>
            {order.stripe_intent ? (
              <a
                href={`https://dashboard.stripe.com/payments/${order.stripe_intent}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block font-sans text-[10.5px] font-medium uppercase tracking-[0.2em] text-mist no-underline transition-colors hover:text-ink"
              >
                Stripe で見る ↗
              </a>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
