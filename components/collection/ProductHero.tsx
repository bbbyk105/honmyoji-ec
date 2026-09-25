"use client";

import Image from "next/image";
import { ViewTransition } from "react";
import { LINE_RATIO, productImage, type Product } from "@/data/products";
import { useLightboxSafe } from "./Lightbox";

/**
 * 商品ページのヒーロー。一覧の `PieceTile` と同じ写真・同じ比率・同じ view-transition 名で
 * モーフする（比率が違うと object-cover の切り口が途中で変わり、像が滑る）。
 *
 * 画面の高さを超えない —— 4:5 を列いっぱいに引くと 1440px 幅で 820px になり、ヒーローの
 * 下端が折り目の下へ落ちる。高さから幅を決め、**列の左端に着ける**（中央に浮かせると、
 * ヘッダーの MIROKU と版面の左端から 40px だけずれて、揃え損ねに見える）。
 */
export function ProductHero({ product }: { product: Product }) {
  /* 拡大表示は LightboxProvider があるときだけ。ヒーローは単体でも置けるようにしておく。 */
  const lightbox = useLightboxSafe();
  const tall = LINE_RATIO[product.line] === "4/5";

  return (
    <div
      className={`relative w-full ${
        tall
          ? "aspect-[4/5] max-w-[calc((100svh-128px)*0.8)]"
          : "aspect-[3/2]"
      }`}
    >
      <ViewTransition name={`bag-${product.folder}`} share="morph" default="none">
        <Image
          src={productImage(product.slug, 1)}
          alt={`${product.name} — ${product.note}`}
          fill
          priority
          fetchPriority="high"
          sizes="(min-width: 768px) 50vw, 100vw"
          className={`object-cover ${product.status === "sold_out" ? "opacity-60" : ""}`}
        />
      </ViewTransition>
      {lightbox ? (
        <button
          type="button"
          onClick={() => lightbox.open(0)}
          data-cursor="Zoom"
          aria-label={`${product.name} の写真を拡大する`}
          className="absolute inset-0 cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-ivory/30 focus-visible:ring-offset-4 focus-visible:ring-offset-sumi"
        />
      ) : null}
    </div>
  );
}
