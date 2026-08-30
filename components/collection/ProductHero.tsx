"use client";

import Image from "next/image";
import { ViewTransition } from "react";
import { productCutout, type Product } from "@/data/products";

/**
 * 詳細ページのヒーロー。一覧の FloatingBag と同じ view-transition 名で morph する。
 * 像の枠は cutoutAspect でぴったりに切っておく — 一覧側の枠と形が揃っていないと morph が滑らない。
 */
export function ProductHero({ product }: { product: Product }) {
  const bagH = Math.round(78 * product.cutoutScale);

  return (
    <div className="relative flex h-[46vh] min-h-[280px] w-full items-end justify-center pb-8 sm:h-[52vh] sm:min-h-[340px] sm:pb-12 lg:h-[calc(100vh-80px)] lg:min-h-[520px]">
      <div
        className="relative max-w-full"
        style={{ height: `${bagH}%`, aspectRatio: `${product.cutoutAspect}` }}
      >
        <span
          aria-hidden
          className="absolute bottom-[-3%] left-1/2 h-[4%] w-[66%] -translate-x-1/2 rounded-[50%] bg-ink/30 blur-[18px]"
        />
        <div className="bag-shadow-owner absolute inset-0">
          <ViewTransition name={`bag-${product.folder}`} share="morph" default="none">
            <Image
              src={productCutout(product.slug)}
              alt={`${product.name} — ${product.note}`}
              fill
              priority
              fetchPriority="high"
              sizes="(min-width: 1024px) 48vw, 90vw"
              className="object-contain object-bottom"
            />
          </ViewTransition>
        </div>
      </div>
    </div>
  );
}
