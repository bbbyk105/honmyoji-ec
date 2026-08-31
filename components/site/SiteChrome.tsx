import type { ReactNode } from "react";

import { CartProvider } from "@/components/cart/CartProvider";
import { MiniCart } from "@/components/cart/MiniCart";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getCatalog } from "@/lib/catalog";
import { stripeEnabled } from "@/lib/stripe";

/**
 * 公開サイトの外枠 — ヘッダー・フッター・カート・Lenis。
 *
 * `app/(site)/layout.tsx` と `app/not-found.tsx` の両方がこれを使う。404 は
 * ルートセグメントに一致しないので (site) の layout を通らず、ここを共有しないと
 * ヘッダーもフッターも無い裸のページになる。
 *
 * `/studio` はこの外枠の外にある。管理画面にサイトのヘッダーと慣性スクロールは要らない。
 *
 * カタログをここで一度引いて MiniCart に渡す。カートは client なので DB を読めず、
 * data/products.ts を直接見ると管理画面で直した価格が反映されない。
 */
export async function SiteChrome({ children }: { children: ReactNode }) {
  const catalog = await getCatalog();

  return (
    <CartProvider>
      <SmoothScroll>
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <MiniCart catalog={catalog} canCheckout={stripeEnabled} />
      </SmoothScroll>
    </CartProvider>
  );
}
