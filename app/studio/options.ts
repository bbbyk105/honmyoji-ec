import type { ProductStatus } from "@/data/products";
import type { OrderStatus } from "@/lib/orders";

/**
 * 選択肢の定数。actions.ts（"use server"）には置けない —— あちらから非 async の
 * 値を export すると 500 になる。
 */

export const PIECE_STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "available", label: "Available — 購入可能" },
  { value: "reserved", label: "Reserved — 取り置き中" },
  { value: "sold_out", label: "Sold out — 完売" },
  { value: "coming_soon", label: "Coming soon — 販売予定" },
];

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "paid", label: "Paid — 入金済み・未発送" },
  { value: "shipped", label: "Shipped — 発送済み" },
  { value: "cancelled", label: "Cancelled — 取消" },
  { value: "refunded", label: "Refunded — 返金済み" },
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  paid: "Paid",
  shipped: "Shipped",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

/**
 * ステータスの色。moss は「購入可能」の色なので、注文側で「取消」に使わない。
 * 失敗・取消は clay（DESIGN.md の決定ログ 2026-08-31）。
 */
export const PIECE_STATUS_COLOR: Record<ProductStatus, string> = {
  available: "bg-moss",
  reserved: "bg-clay",
  sold_out: "bg-mist",
  coming_soon: "bg-indigo",
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  paid: "bg-moss",
  shipped: "bg-indigo",
  cancelled: "bg-mist",
  refunded: "bg-clay",
};
