import Link from "next/link";

import { PIECE_STATUS_COLOR, PIECE_STATUS_NAME } from "@/app/studio/options";
import { DbNotice } from "@/components/studio/DbNotice";
import { LINK_QUIET, STUDIO_CARD, STUDIO_SHELL } from "@/components/studio/shell";
import { OrderBadge } from "@/components/studio/StatusBadge";
import { Kpi, StudioHead } from "@/components/studio/StudioHead";
import type { ProductStatus } from "@/data/products";
import { getCatalog } from "@/lib/catalog";
import { getOrders, orderAmount, orderRef } from "@/lib/orders";
import { requireSession } from "@/lib/studio-session";
import { dbEnabled } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const PIECE_ORDER: ProductStatus[] = ["available", "made_to_order", "reserved", "sold_out", "coming_soon"];

/**
 * 今日の状態。
 *
 * 一点物の店で見るべきは「送っていない注文があるか」と「いま買えるものが何点あるか」の
 * 二つ。数字は見出しの下に大きく出し、その下に直近の注文と在庫の内訳を置く。
 */
export default async function StudioOverviewPage() {
  await requireSession();

  const [catalog, orders] = await Promise.all([getCatalog(), getOrders()]);

  const counts = PIECE_ORDER.map((status) => ({
    status,
    count: catalog.filter((p) => p.status === status).length,
  })).filter((row) => row.count > 0);

  const unshipped = orders.filter((o) => o.status === "paid");
  const available = catalog.filter((p) => p.status === "available").length;
  const recent = orders.slice(0, 6);

  return (
    <div className={`${STUDIO_SHELL} pb-24`}>
      <StudioHead
        title={
          unshipped.length > 0 ? `送る品が ${unshipped.length} 点あります` : "送っていない注文はありません"
        }
        kpis={
          <>
            <Kpi
              label="未発送の注文"
              value={unshipped.length}
              suffix="件"
              tone={unshipped.length > 0 ? "alert" : undefined}
            />
            <Kpi label="注文（累計）" value={orders.length} suffix="件" />
            <Kpi label="購入可能" value={available} suffix={`/ ${catalog.length} 点`} />
            <Kpi
              label="完売"
              value={catalog.filter((p) => p.status === "sold_out").length}
              suffix="点"
            />
          </>
        }
      />

      {!dbEnabled ? <DbNotice /> : null}

      <div className="grid gap-x-10 gap-y-10 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="flex items-baseline justify-between gap-6 pb-3">
            <h2 className="font-sans text-[15px] font-semibold text-ivory">最近の注文</h2>
            <Link href="/studio/orders" className={LINK_QUIET}>
              すべて見る →
            </Link>
          </div>

          <div className={STUDIO_CARD}>
            {recent.length === 0 ? (
              <p className="px-5 py-6 font-sans text-[14px] leading-[1.9] text-mist">
                まだ注文はありません。Stripe の決済が通ると、ここに入金と送り先が並びます。
                Contact からの取り置き依頼は、いつも通り Telegram に届きます。
              </p>
            ) : (
              <ul>
                {recent.map((order) => (
                  <li key={order.id} className="border-t border-line first:border-t-0">
                    <Link
                      href={`/studio/orders/${order.id}`}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-1.5 px-5 py-4 no-underline transition-colors hover:bg-ivory/4"
                    >
                      <span className="min-w-0">
                        <span className="font-mono text-[13px] text-ivory">{orderRef(order.id)}</span>
                        <span className="ml-3 font-sans text-[14px] text-bone">
                          {order.customer_name ?? order.customer_email ?? "—"}
                        </span>
                        <span className="mt-1 block truncate font-sans text-[12.5px] text-mist">
                          {order.slugs.join(" · ") || "—"}
                        </span>
                      </span>
                      <span className="flex items-center gap-4">
                        <OrderBadge status={order.status} />
                        <span className="font-sans text-[15px] tabular-nums text-ivory">
                          {orderAmount(order)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside>
          <div className="flex items-baseline justify-between gap-6 pb-3">
            <h2 className="font-sans text-[15px] font-semibold text-ivory">在庫</h2>
            <Link href="/studio/pieces" className={LINK_QUIET}>
              状態を変える →
            </Link>
          </div>
          <dl className={`${STUDIO_CARD} px-5 py-2`}>
            {counts.map(({ status, count }) => (
              <div key={status} className="flex items-center gap-3 border-t border-line py-3 first:border-t-0">
                <span aria-hidden className={`h-1.5 w-1.5 ${PIECE_STATUS_COLOR[status]}`} />
                <dt className="font-sans text-[14px] text-bone">{PIECE_STATUS_NAME[status]}</dt>
                <dd className="ml-auto font-sans text-[15px] tabular-nums text-ivory">{count} 点</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  );
}
