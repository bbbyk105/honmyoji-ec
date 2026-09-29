import type { ProductStatus } from "@/data/products";
import type { OrderStatus } from "@/lib/orders";

/**
 * 選択肢の定数。actions.ts（"use server"）には置けない —— あちらから非 async の
 * 値を export すると 500 になる。
 *
 * 管理画面の語は日本語が先。公開サイトに出る英語の語（Available など）は、
 * 画面とサイトを突き合わせるときのために後ろに添える。
 */

export const PIECE_STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "available", label: "購入可能 — Available" },
  { value: "coming_soon", label: "販売予定 — Coming soon" },
  { value: "reserved", label: "取り置き中 — Reserved" },
  { value: "sold_out", label: "完売 — Sold out" },
  { value: "made_to_order", label: "受注生産 — Made to order" },
];

/**
 * 一覧の絞り込み・バッジに出す短い名前。`STATUS_LABEL` の値を import しないのは、
 * 一覧の client 部品がこのファイルを読むため（`data/products.ts` の値を引くと、
 * カタログ本体まで client のバンドルに載る）。
 */
export const PIECE_STATUS_NAME: Record<ProductStatus, string> = {
  available: "購入可能",
  coming_soon: "販売予定",
  reserved: "取り置き中",
  sold_out: "完売",
  made_to_order: "受注生産",
};

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "paid", label: "入金済み・未発送 — Paid" },
  { value: "shipped", label: "発送済み — Shipped" },
  { value: "cancelled", label: "取消 — Cancelled" },
  { value: "refunded", label: "返金済み — Refunded" },
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  paid: "未発送",
  shipped: "発送済み",
  cancelled: "取消",
  refunded: "返金済み",
};

/**
 * ステータスの色。moss は「購入可能」の色なので、注文側で「取消」に使わない。
 * 失敗・取消は clay（DESIGN.md の決定ログ 2026-08-31）。紙の面の上では、どれも
 * 同じ色相のまま明度を落とした値に入れ替わる（`.surface-paper`）。
 *
 * `…_COLOR` は点、`…_TONE` はバッジ（罫・薄い地・字）。どちらも必ず語と並べる ——
 * 色だけで読ませない。
 */
export const PIECE_STATUS_COLOR: Record<ProductStatus, string> = {
  available: "bg-moss",
  /* reserved と同じ clay。点には必ずラベルが並ぶので、色だけで読ませていない。 */
  made_to_order: "bg-clay",
  reserved: "bg-clay",
  sold_out: "bg-mist",
  coming_soon: "bg-indigo",
};

export const PIECE_STATUS_TONE: Record<ProductStatus, string> = {
  available: "border-moss/45 bg-moss/10 text-moss",
  made_to_order: "border-clay/45 bg-clay/10 text-clay",
  reserved: "border-clay/45 bg-clay/10 text-clay",
  sold_out: "border-line bg-ivory/4 text-mist",
  coming_soon: "border-indigo/45 bg-indigo/10 text-indigo",
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  paid: "bg-moss",
  shipped: "bg-indigo",
  cancelled: "bg-mist",
  refunded: "bg-clay",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
  paid: "border-moss/45 bg-moss/10 text-moss",
  shipped: "border-indigo/45 bg-indigo/10 text-indigo",
  cancelled: "border-line bg-ivory/4 text-mist",
  refunded: "border-clay/45 bg-clay/10 text-clay",
};
