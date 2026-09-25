import Image from "next/image";
import { ViewTransition } from "react";
import { LINE_RATIO, productImage, type Product } from "@/data/products";
import { ZoomHit } from "./Lightbox";

/**
 * 商品ページのヒーロー。一覧の `PieceTile` と同じ写真・同じ比率・同じ view-transition 名で
 * モーフする（比率が違うと object-cover の切り口が途中で変わり、像が滑る）。
 *
 * 画面の高さを超えない —— 4:5 を列いっぱいに引くと 1440px 幅で 820px になり、ヒーローの
 * 下端が折り目の下へ落ちる。高さから幅を決め、**列の左端に着ける**（中央に浮かせると、
 * ヘッダーの MIROKU と版面の左端から 40px だけずれて、揃え損ねに見える）。
 *
 * Server Component。押せるのは写真の上の当たり判定（`ZoomHit`）だけなので、client に降りるのはそこだけ。
 */
export function ProductHero({ product }: { product: Product }) {
  const tall = LINE_RATIO[product.line] === "4/5";

  return (
    <div
      className={`relative w-full ${tall ? "aspect-[4/5] max-w-[calc((100svh-128px)*0.8)]" : "aspect-[3/2]"}`}
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
      {/* 拡大表示は LightboxProvider があるときだけ（無ければ ZoomHit は何も出さない）。 */}
      <ZoomHit
        index={0}
        cursor="Zoom"
        label={`${product.name} の写真を拡大する`}
        className="focus-visible:ring-offset-4"
      />
    </div>
  );
}
