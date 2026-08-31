"use client";

import { useMemo, useState } from "react";
import { LINE_LABEL, type Product, type ProductLine, type ProductStatus } from "@/data/products";
import { FloatingBag } from "./FloatingBag";

type LineFilter = "all" | ProductLine;
type StatusFilter = "all" | ProductStatus;
type SortKey = "given" | "price-asc" | "price-desc";

const chip =
  "min-h-11 shrink-0 px-2.5 font-sans text-[10.5px] uppercase tracking-[0.2em] sm:px-0";

/** カタログはサーバーから渡す — 管理画面で直した価格とステータスをそのまま映すため。 */
export function CollectionStudio({ pieces }: { pieces: Product[] }) {
  const [line, setLine] = useState<LineFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("given");

  const list = useMemo(() => {
    let next = pieces.filter((p) => (line === "all" ? true : p.line === line));
    next = next.filter((p) => (status === "all" ? true : p.status === status));
    if (sort === "price-asc") next = [...next].sort((a, b) => a.priceAud - b.priceAud);
    if (sort === "price-desc") next = [...next].sort((a, b) => b.priceAud - a.priceAud);
    return next;
  }, [pieces, line, status, sort]);

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-line pb-5 md:gap-6 md:pb-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
          <div className="flex flex-nowrap gap-1 sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
            {(
              [
                ["all", "All"],
                ["tatami-beri", LINE_LABEL["tatami-beri"].en],
                ["kimono-remake", LINE_LABEL["kimono-remake"].en],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setLine(key)}
                className={`${chip} ${line === key ? "text-ink" : "text-mist hover:text-ink"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
          <div className="flex flex-nowrap items-center gap-1 sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
            {(
              [
                ["all", "Any state"],
                ["available", "Available"],
                ["reserved", "Reserved"],
                ["coming_soon", "Coming"],
                ["sold_out", "Sold"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatus(key)}
                className={`${chip} text-[10px] ${status === key ? "text-ink" : "text-mist hover:text-ink"}`}
              >
                {label}
              </button>
            ))}
            <span aria-hidden className="px-1 text-line">
              /
            </span>
            {(
              [
                ["given", "As shown"],
                ["price-asc", "Price ↑"],
                ["price-desc", "Price ↓"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSort(key)}
                className={`${chip} text-[10px] ${sort === key ? "text-ink" : "text-mist hover:text-ink"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 font-sans text-[11px] tracking-[0.16em] text-mist">
        {list.length} {list.length === 1 ? "piece" : "pieces"}
      </p>

      {/* 展示台はどれも同じ 4:5。作品ごとに違うのは像そのものだけ。 */}
      <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 md:gap-x-10 xl:grid-cols-3">
        {list.map((p, i) => (
          <div key={p.slug} className="flex flex-col">
            <FloatingBag product={p} index={i % 3} priority={i < 3} />
            <p className="mt-3 max-w-[36ch] font-sans text-[12.5px] leading-[1.75] text-charcoal/75">{p.note}</p>
          </div>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="py-20 font-display text-[28px] font-light text-ink">Nothing in this view.</p>
      ) : null}
    </div>
  );
}
