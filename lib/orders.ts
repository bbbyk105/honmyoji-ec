import { cache } from "react";

import { db } from "@/lib/supabase";

/* ------------------------------------------------------------------
   注文。Stripe の Webhook が作り、管理画面が発送まで進める。
   **サーバ専用**。
   ------------------------------------------------------------------ */

export type OrderStatus = "paid" | "shipped" | "cancelled" | "refunded";

export type ShippingAddress = {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
};

export type Order = {
  id: number;
  stripe_session: string | null;
  stripe_intent: string | null;
  slugs: string[];
  amount_cents: number;
  currency: string;
  status: OrderStatus;
  customer_name: string | null;
  customer_email: string | null;
  shipping: ShippingAddress | null;
  tracking: string | null;
  memo: string | null;
  created_at: string;
  shipped_at: string | null;
};

const STATUSES: OrderStatus[] = ["paid", "shipped", "cancelled", "refunded"];

function toOrder(row: Record<string, unknown>): Order {
  const status = row.status;
  return {
    id: Number(row.id),
    stripe_session: (row.stripe_session as string) ?? null,
    stripe_intent: (row.stripe_intent as string) ?? null,
    slugs: Array.isArray(row.slugs) ? (row.slugs as string[]) : [],
    amount_cents: Number(row.amount_cents ?? 0),
    currency: (row.currency as string) ?? "aud",
    status: (STATUSES as string[]).includes(status as string) ? (status as OrderStatus) : "paid",
    customer_name: (row.customer_name as string) ?? null,
    customer_email: (row.customer_email as string) ?? null,
    shipping: (row.shipping as ShippingAddress) ?? null,
    tracking: (row.tracking as string) ?? null,
    memo: (row.memo as string) ?? null,
    created_at: (row.created_at as string) ?? "",
    shipped_at: (row.shipped_at as string) ?? null,
  };
}

/**
 * 注文番号。DB の id をそのまま見せると 1 から始まって心細いので、桁を揃えて
 * 前置きを付ける。人が電話やメールで読み上げる文字列。
 */
export function orderRef(id: number): string {
  return `MI-${String(id).padStart(4, "0")}`;
}

/** 金額の表記。DB はセント単位、表示は A$220（サイトと同じ書き方）。 */
export function orderAmount(order: Order): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: order.currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(order.amount_cents / 100);
}

export const getOrders = cache(async (): Promise<Order[]> => {
  const client = db();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []).map((row) => toOrder(row as Record<string, unknown>));
  } catch (error) {
    console.error("[studio] 注文の読み込みに失敗", error);
    return [];
  }
});

export async function getOrder(id: number): Promise<Order | null> {
  const client = db();
  if (!client) return null;

  try {
    const { data, error } = await client.from("orders").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? toOrder(data as Record<string, unknown>) : null;
  } catch (error) {
    console.error(`[studio] 注文 ${id} の読み込みに失敗`, error);
    return null;
  }
}
