import Image from "next/image";
import { ViewTransition } from "react";
import { cutoutSrc, type Product } from "@/data/products";
import { ZoomHit } from "./Lightbox";

/**
 * 詳細ページのヒーロー。一覧の FloatingBag と同じ view-transition 名で morph する。
 * 像の枠は cutoutAspect でぴったりに切っておく — 一覧側の枠と形が揃っていないと morph が滑らない。
 *
 * Server Component。押せるのは像の上の当たり判定（`ZoomHit`）だけなので、client に降りるのはそこだけ。
 */
export function ProductHero({ product }: { product: Product }) {
  /* 一覧と同じ背丈。横に太い作品は max-w-full が列の幅で受け止める（下の註）。 */
  const bagH = 78;

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
              src={cutoutSrc(product.folder)}
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
            そこ全部を押せるようにするとスクロール中に誤って開く。
            拡大表示は LightboxProvider があるときだけ（無ければ ZoomHit は何も出さない）。 */}
        <ZoomHit index={0} label={`${product.name} の写真を拡大する`} className="focus-visible:ring-offset-4" />
      </div>
    </div>
  );
}
