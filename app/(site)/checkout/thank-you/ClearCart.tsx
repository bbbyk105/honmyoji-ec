"use client";

import { useEffect } from "react";

import { useCart } from "@/components/cart/CartProvider";

/**
 * 決済が済んだらカートを空にする。
 *
 * 買った品がカートに残っていると、次に開いたときにまだ買えるように見える。
 * 注文の確定は Webhook がやるので、ここは手元の表示を合わせるだけ。
 */
export function ClearCart() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
