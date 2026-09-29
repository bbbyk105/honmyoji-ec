import {
  ORDER_STATUS_COLOR,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  PIECE_STATUS_COLOR,
  PIECE_STATUS_NAME,
  PIECE_STATUS_TONE,
} from "@/app/studio/options";
import type { ProductStatus } from "@/data/products";
import type { OrderStatus } from "@/lib/orders";

const BADGE =
  "inline-flex shrink-0 items-center gap-1.5 border px-2.5 py-1 font-sans text-[12.5px] leading-none whitespace-nowrap";

/** 作品の状態。点と語を並べる —— 色だけで読ませない。 */
export function PieceBadge({ status }: { status: ProductStatus }) {
  return (
    <span className={`${BADGE} ${PIECE_STATUS_TONE[status]}`}>
      <span aria-hidden className={`h-1.5 w-1.5 ${PIECE_STATUS_COLOR[status]}`} />
      {PIECE_STATUS_NAME[status]}
    </span>
  );
}

export function OrderBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`${BADGE} ${ORDER_STATUS_TONE[status]}`}>
      <span aria-hidden className={`h-1.5 w-1.5 ${ORDER_STATUS_COLOR[status]}`} />
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
