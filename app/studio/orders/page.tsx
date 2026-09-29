import Link from "next/link";

import { DbNotice } from "@/components/studio/DbNotice";
import { STUDIO_CARD, STUDIO_SHELL } from "@/components/studio/shell";
import { OrderBadge } from "@/components/studio/StatusBadge";
import { Kpi, StudioHead } from "@/components/studio/StudioHead";
import { getOrders, orderAmount, orderRef } from "@/lib/orders";
import { requireSession } from "@/lib/studio-session";
import { dbEnabled } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function shortDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

export default async function StudioOrdersPage() {
  await requireSession();

  const orders = await getOrders();
  const unshipped = orders.filter((o) => o.status === "paid").length;
  const shipped = orders.filter((o) => o.status === "shipped").length;

  return (
    <div className={`${STUDIO_SHELL} pb-24`}>
      <StudioHead
        title="注文"
        lead="Stripe の決済が通ると、Webhook がここに一行足します。発送したら注文を開いて「発送済み」にしてください。"
        kpis={
          <>
            <Kpi label="未発送" value={unshipped} suffix="件" tone={unshipped > 0 ? "alert" : undefined} />
            <Kpi label="発送済み" value={shipped} suffix="件" />
            <Kpi label="注文（累計）" value={orders.length} suffix="件" />
          </>
        }
      />

      {!dbEnabled ? <DbNotice /> : null}

      {orders.length === 0 ? (
        <p className={`${STUDIO_CARD} px-5 py-6 font-sans text-[14px] leading-[1.9] text-mist`}>
          まだ注文はありません。
        </p>
      ) : (
        <div className={STUDIO_CARD}>
          <div className="hidden grid-cols-[96px_110px_minmax(0,1fr)_minmax(0,180px)_110px_110px] items-end gap-5 border-b border-line px-5 pb-3 pt-4 font-sans text-[12.5px] text-mist md:grid">
            <span>注文番号</span>
            <span>日付</span>
            <span>お客さま</span>
            <span>作品</span>
            <span>状態</span>
            <span className="text-right">金額</span>
          </div>

          <ul>
            {orders.map((order) => (
              <li key={order.id} className="border-t border-line first:border-t-0">
                <Link
                  href={`/studio/orders/${order.id}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-1.5 px-5 py-4 no-underline transition-colors hover:bg-ivory/4 md:grid-cols-[96px_110px_minmax(0,1fr)_minmax(0,180px)_110px_110px]"
                >
                  <span className="font-mono text-[13px] text-ivory">{orderRef(order.id)}</span>
                  <span className="font-sans text-[13px] tabular-nums text-mist">
                    {shortDate(order.created_at)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-sans text-[14.5px] text-ivory">
                      {order.customer_name ?? "—"}
                    </span>
                    <span className="block truncate font-sans text-[12.5px] text-mist">
                      {order.customer_email ?? ""}
                    </span>
                  </span>
                  <span className="truncate font-sans text-[13px] text-bone">
                    {order.slugs.join(" · ") || "—"}
                  </span>
                  <span>
                    <OrderBadge status={order.status} />
                  </span>
                  <span className="font-sans text-[15px] tabular-nums text-ivory md:text-right">
                    {orderAmount(order)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
