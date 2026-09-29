import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LINK_QUIET, STUDIO_CARD, STUDIO_SHELL } from "@/components/studio/shell";
import { OrderBadge } from "@/components/studio/StatusBadge";
import { StudioHead } from "@/components/studio/StudioHead";
import { leadSrc, priceLabel } from "@/data/products";
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

const HEADING = "font-sans text-[14px] font-semibold text-ivory";

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
    <div className={`${STUDIO_SHELL} pb-24`}>
      <StudioHead
        back={{ href: "/studio/orders", label: "注文" }}
        title={orderRef(order.id)}
        sub={
          <span className="flex flex-wrap items-center gap-3">
            <OrderBadge status={order.status} />
            {fullDate(order.created_at)}
          </span>
        }
        action={
          <p className="font-display text-[34px] font-light leading-none tabular-nums text-ivory">
            {orderAmount(order)}
          </p>
        }
      />

      <div className="grid gap-x-10 gap-y-10 lg:grid-cols-[1fr_340px]">
        <div className={`${STUDIO_CARD} self-start px-5 py-6 md:px-8 md:py-8`}>
          <OrderForm order={order} />
        </div>

        <aside className="space-y-6">
          <section className={`${STUDIO_CARD} px-5 py-5`}>
            <h2 className={HEADING}>作品</h2>
            <ul className="mt-4 space-y-4">
              {pieces.length === 0 ? (
                <li className="font-sans text-[13.5px] text-mist">{order.slugs.join(" · ") || "—"}</li>
              ) : (
                pieces.map((piece) => (
                  <li key={piece.slug} className="flex items-center gap-4">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-field">
                      <Image src={leadSrc(piece.folder)} alt="" fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/studio/pieces/${piece.slug}`}
                        className="font-sans text-[15px] font-semibold text-ivory no-underline hover:underline"
                      >
                        {piece.name}
                      </Link>
                      <p className="font-mono text-[12px] text-mist">{piece.sku}</p>
                    </div>
                    <p className="ml-auto font-sans text-[14px] tabular-nums text-ivory">
                      {priceLabel(piece) ?? "—"}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className={`${STUDIO_CARD} px-5 py-5`}>
            <h2 className={HEADING}>送り先</h2>
            {address ? (
              <address className="mt-3 font-sans text-[14px] not-italic leading-[1.9] text-ivory">
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
              <p className="mt-3 font-sans text-[13.5px] leading-[1.8] text-mist">
                住所が届いていません。Stripe の Checkout で住所の取得を有効にしてください。
              </p>
            )}

            {order.customer_email ? (
              <p className="mt-3 font-sans text-[14px]">
                <a
                  href={`mailto:${order.customer_email}`}
                  className="text-ivory underline decoration-line underline-offset-[5px] transition-colors hover:decoration-ivory"
                >
                  {order.customer_email}
                </a>
              </p>
            ) : null}
          </section>

          <section className={`${STUDIO_CARD} px-5 py-5`}>
            <h2 className={HEADING}>Stripe</h2>
            <dl className="mt-3 space-y-3 font-sans text-[13px] leading-[1.6]">
              <div>
                <dt className="text-mist">Payment intent</dt>
                <dd className="mt-1 break-all font-mono text-[12px] text-ivory">
                  {order.stripe_intent ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-mist">発送日</dt>
                <dd className="mt-1 text-ivory">{fullDate(order.shipped_at)}</dd>
              </div>
            </dl>
            {order.stripe_intent ? (
              <a
                href={`https://dashboard.stripe.com/payments/${order.stripe_intent}`}
                target="_blank"
                rel="noreferrer"
                className={`mt-4 inline-block ${LINK_QUIET}`}
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
