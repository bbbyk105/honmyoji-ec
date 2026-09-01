import Link from "next/link";

import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, PIECE_STATUS_COLOR } from "@/app/studio/options";
import { DbNotice } from "@/components/studio/DbNotice";
import { STUDIO_HEAD, STUDIO_SHELL } from "@/components/studio/shell";
import { STATUS_LABEL, type ProductStatus } from "@/data/products";
import { getCatalog } from "@/lib/catalog";
import { getOrders, orderAmount, orderRef } from "@/lib/orders";
import { requireSession } from "@/lib/studio-session";
import { dbEnabled } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const PIECE_ORDER: ProductStatus[] = ["available", "made_to_order", "reserved", "sold_out", "coming_soon"];

/**
 * 今日の状態。
 *
 * 数字のタイルを並べた「ダッシュボード」にはしない —— 十点の一点物で見るべきは
 * 「送っていない注文があるか」と「いま買えるものが何点あるか」の二つだけで、
 * それ以外の指標は数えるほど中身が薄くなる。
 */
export default async function StudioOverviewPage() {
  await requireSession();

  const [catalog, orders] = await Promise.all([getCatalog(), getOrders()]);

  const counts = PIECE_ORDER.map((status) => ({
    status,
    count: catalog.filter((p) => p.status === status).length,
  })).filter((row) => row.count > 0);

  const unshipped = orders.filter((o) => o.status === "paid");
  const recent = orders.slice(0, 6);

  return (
    <div className={STUDIO_SHELL}>
      <div className={STUDIO_HEAD}>
        <p className="eyebrow">Overview</p>
        <h1 className="mt-4 font-display text-[clamp(32px,4.4vw,46px)] font-light leading-[1.05] text-ink">
          {unshipped.length > 0
            ? `送る品が ${unshipped.length} 点あります`
            : "送っていない注文はありません"}
        </h1>
      </div>

      {!dbEnabled ? <DbNotice /> : null}

      <div className="grid gap-x-16 gap-y-12 pb-24 pt-11 lg:grid-cols-[1fr_300px]">
        <section>
          <div className="flex items-baseline justify-between gap-6 border-b border-line pb-3">
            <h2 className="eyebrow">最近の注文</h2>
            <Link
              href="/studio/orders"
              className="font-sans text-[10.5px] font-medium uppercase tracking-[0.2em] text-mist no-underline transition-colors hover:text-ink"
            >
              すべて見る
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="max-w-[38em] py-8 font-sans text-[13.5px] leading-[1.9] text-mist">
              まだ注文はありません。Stripe の決済が通ると、ここに入金と送り先が並びます。
              それまでは Contact からの取り置き依頼が、いつも通り Telegram に届きます。
            </p>
          ) : (
            <ul>
              {recent.map((order) => (
                <li key={order.id} className="border-b border-line">
                  <Link
                    href={`/studio/orders/${order.id}`}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-x-5 gap-y-1 py-4 no-underline transition-colors hover:bg-paper"
                  >
                    <span
                      aria-hidden
                      className={`h-1.5 w-1.5 ${ORDER_STATUS_COLOR[order.status]}`}
                    />
                    <span className="min-w-0">
                      <span className="font-mono text-[12.5px] tracking-[0.06em] text-ink">
                        {orderRef(order.id)}
                      </span>
                      <span className="ml-3 font-sans text-[13.5px] text-charcoal">
                        {order.customer_name ?? order.customer_email ?? "—"}
                      </span>
                      <span className="mt-1 block truncate font-sans text-[12px] text-mist">
                        {order.slugs.join(" · ") || "—"} · {ORDER_STATUS_LABEL[order.status]}
                      </span>
                    </span>
                    <span className="text-right font-sans text-[14px] tabular-nums text-ink">
                      {orderAmount(order)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside>
          <h2 className="eyebrow border-b border-line pb-3">在庫</h2>
          <dl className="mt-4 space-y-3">
            {counts.map(({ status, count }) => (
              <div key={status} className="flex items-center gap-3">
                <span aria-hidden className={`h-1.5 w-1.5 ${PIECE_STATUS_COLOR[status]}`} />
                <dt className="font-sans text-[13px] text-charcoal">{STATUS_LABEL[status].en}</dt>
                <dd className="ml-auto font-sans text-[14px] tabular-nums text-ink">{count}</dd>
              </div>
            ))}
          </dl>
          <Link
            href="/studio/pieces"
            className="mt-6 inline-block font-sans text-[10.5px] font-medium uppercase tracking-[0.2em] text-mist no-underline transition-colors hover:text-ink"
          >
            作品を編集する
          </Link>
        </aside>
      </div>
    </div>
  );
}
