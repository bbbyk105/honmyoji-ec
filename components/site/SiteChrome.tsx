import { ViewTransition, type ReactNode } from "react";

import { CartProvider } from "@/components/cart/CartProvider";
import { MiniCart } from "@/components/cart/MiniCart";
import { EntryCurtain } from "@/components/motion/EntryCurtain";
import { PageTransition } from "@/components/motion/PageTransition";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { CursorMark } from "@/components/site/CursorMark";
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
 *
 * 入場の幕・ページ遷移・カーソルの語もここに置く。`/studio` はこの外枠の外なので、
 * 管理画面には一つも付いてこない（値を直す画面に演出は要らない）。
 */

/**
 * 入場の幕を「もう見たか」を、塗る前に決める一行。
 *
 * mount 後に sessionStorage を読むと、判定が付くまでの一瞬だけ幕が見えてしまう —— 二度目の
 * 訪問でいちばん目立つ事故なので、body の先頭で同期的に印を付けて CSS 側で消す。
 * `try` で囲むのはプライベートウィンドウ対策（読めなければ幕が毎回出るだけで、壊れはしない）。
 */
const ENTERED_FLAG = `try{if(sessionStorage.getItem("miroku-entered"))document.documentElement.dataset.entered="1"}catch(e){}`;

export async function SiteChrome({ children }: { children: ReactNode }) {
  const catalog = await getCatalog();

  return (
    <CartProvider>
      <SmoothScroll>
        <script dangerouslySetInnerHTML={{ __html: ENTERED_FLAG }} />
        <EntryCurtain />
        <SiteHeader />
        {/*
          ページの移り変わりはここで起きる。**React の `<ViewTransition>` が関与しない更新では
          ブラウザの遷移は始まらない** —— 包む前は `::view-transition-*(root)` の指定が、
          作品のモーフ以外では一度も走っていなかった（2026-09-20 に計測して判明）。
          本文だけを包むので、ヘッダーとフッターは動かない（`site-header` は元から固定）。
          所作は `app/globals.css` の `.page` を読むこと。
        */}
        <ViewTransition default="page">
          <main className="flex-1">{children}</main>
        </ViewTransition>
        <SiteFooter />
        <MiniCart catalog={catalog} canCheckout={stripeEnabled} />
        <PageTransition />
        <CursorMark />
      </SmoothScroll>
    </CartProvider>
  );
}
