import Link from "next/link";

import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "@/app/studio/options";
import { DbNotice } from "@/components/studio/DbNotice";
import { STUDIO_HEAD, STUDIO_SHELL } from "@/components/studio/shell";
import { getOrders, orderAmount, orderRef } from "@/lib/orders";
import { requireSession } from "@/lib/studio-session";
import { dbEnabled } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function shortDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "2-digit",
    month: "numeric",
    day: "numeric",
  });
}

export default async function StudioOrdersPage() {
  await requireSession();

  const orders = await getOrders();
  const unshipped = orders.filter((o) => o.status === "paid").length;

  return (
    <div className={STUDIO_SHELL}>
      <div className={STUDIO_HEAD}>
        <p className="eyebrow">Orders</p>
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
          <h1 className="font-display text-[clamp(32px,4.4vw,46px)] font-light leading-[1.05] text-ink">
            注文
          </h1>
          <p className="font-sans text-[12.5px] text-mist">
            {orders.length} 件{unshipped > 0 ? ` — うち未発送 ${unshipped} 件` : ""}
          </p>
        </div>
      </div>

      {!dbEnabled ? <DbNotice /> : null}

      <div className="pb-24">
        {orders.length === 0 ? (
          <p className="max-w-[40em] py-12 font-sans text-[13.5px] leading-[1.9] text-mist">
            まだ注文はありません。Stripe の決済が通ると、Webhook がここに一行足します。
          </p>
        ) : (
          <>
            <div className="hidden grid-cols-[14px_96px_80px_1fr_150px_100px] items-end gap-5 border-b border-line pb-3 pt-9 md:grid">
              <span />
              <span className="eyebrow">No.</span>
              <span className="eyebrow">Date</span>
              <span className="eyebrow">Customer</span>
              <span className="eyebrow">Pieces</span>
              <span className="eyebrow text-right">Amount</span>
            </div>

            <ul>
              {orders.map((order) => (
                <li key={order.id} className="border-b border-line">
                  <Link
                    href={`/studio/orders/${order.id}`}
                    className="grid grid-cols-[14px_1fr] items-center gap-x-5 gap-y-1.5 py-4 no-underline transition-colors hover:bg-paper md:grid-cols-[14px_96px_80px_1fr_150px_100px]"
                  >
                    <span
                      aria-hidden
                      title={ORDER_STATUS_LABEL[order.status]}
                      className={`h-1.5 w-1.5 ${ORDER_STATUS_COLOR[order.status]}`}
                    />
                    <span className="font-mono text-[12.5px] tracking-[0.06em] text-ink">
                      {orderRef(order.id)}
                    </span>
                    <span className="col-start-2 font-sans text-[12.5px] tabular-nums text-mist md:col-start-auto">
                      {shortDate(order.created_at)}
                    </span>
                    <span className="col-start-2 min-w-0 md:col-start-auto">
                      <span className="block truncate font-sans text-[14px] text-charcoal">
                        {order.customer_name ?? "—"}
                      </span>
                      <span className="block truncate font-sans text-[12px] text-mist">
                        {order.customer_email ?? ""}
                      </span>
                    </span>
                    <span className="col-start-2 truncate font-sans text-[12.5px] text-mist md:col-start-auto">
                      {order.slugs.join(" · ") || "—"}
                    </span>
                    <span className="col-start-2 font-sans text-[14px] tabular-nums text-ink md:col-start-auto md:text-right">
                      {orderAmount(order)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
