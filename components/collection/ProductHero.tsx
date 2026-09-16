"use client";

import Image from "next/image";
import { ViewTransition } from "react";
import { productCutout, type Product } from "@/data/products";
import { useLightboxSafe } from "./Lightbox";

/**
 * 詳細ページのヒーロー。一覧の FloatingBag と同じ view-transition 名で morph する。
 * 像の枠は cutoutAspect でぴったりに切っておく — 一覧側の枠と形が揃っていないと morph が滑らない。
 */
export function ProductHero({ product }: { product: Product }) {
  const bagH = Math.round(78 * product.cutoutScale);
  /* 拡大表示は LightboxProvider があるときだけ。ヒーローは単体でも置けるようにしておく。 */
  const lightbox = useLightboxSafe();

  return (
    <div className="relative flex h-[46vh] min-h-[280px] w-full items-end justify-center pb-8 sm:h-[52vh] sm:min-h-[340px] sm:pb-12 lg:h-[calc(100vh-80px)] lg:min-h-[520px]">
      {/*
        棚板。一覧の展示台と同じ考えで、接地は線で作る。ここだけは像の幅ではなく**列の幅**で
        引く —— 像は 39〜100%（ichimatsu は列いっぱいまで太る）とばらつくので、像に合わせると
        作品によって板がはみ出す。列の端で切れば、板の左右はグリッドの実在の線と揃う。
        高さは `items-end` + `pb-8` の分だけ上げれば像の裾と一致する。
      */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-8 h-px bg-ivory/25 sm:bottom-12"
      />
      <div
        className="relative max-w-full"
        style={{ height: `${bagH}%`, aspectRatio: `${product.cutoutAspect}` }}
      >
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
        {/* 当たり判定は像の枠だけ。ヒーローの領域は画面の高さいっぱいあるので、
            そこ全部を押せるようにするとスクロール中に誤って開く。 */}
        {lightbox ? (
          <button
            type="button"
            onClick={() => lightbox.open(0)}
            aria-label={`${product.name} の写真を拡大する`}
            className="absolute inset-0 cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-ivory/30 focus-visible:ring-offset-4 focus-visible:ring-offset-sumi"
          />
        ) : null}
      </div>
    </div>
  );
}
