import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { ImageWell, type WellFrom } from "@/components/site/ImageWell";
import { LINE_RATIO, priceLabel, productImage, productPath, type Product } from "@/data/products";
import { SoldBand } from "./SoldBand";
import { StatusPill } from "./StatusPill";

type Props = {
  product: Product;
  priority?: boolean;
  sizes?: string;
  /** 一言を下に添えるか。狭い帯（関連作品・トップの締め）では外す。 */
  showNote?: boolean;
  from?: WellFrom;
  revealDelay?: number;
  className?: string;
};

const RATIO = { "4/5": "aspect-[4/5]", "3/2": "aspect-[3/2]" } as const;

/**
 * 作品の一枚。一覧・トップ・関連作品はすべてこれ。
 *
 * 写真はカメラマンの撮影そのまま（2026-09-25 にカットアウトの展示台から切り替えた）。
 * 立つ作品は 4:5 で**背丈を揃えて**切ってあり（`scripts/prepare-photos.py`）、同じ床・同じ
 * 障子の前に並ぶので、一列が一つの部屋に見える。比率は区分で決まる（`LINE_RATIO`）。
 *
 * `bag-{folder}` の名前で商品ページのヒーローへモーフする。同じ写真・同じ比率なので、
 * 枠が大きくなるだけで像は歪まない。
 */
export function PieceTile({
  product,
  priority = false,
  sizes = "(min-width: 1280px) 24vw, (min-width: 768px) 32vw, 48vw",
  showNote = true,
  from = "bottom",
  revealDelay = 0,
  className = "",
}: Props) {
  const sold = product.status === "sold_out";
  const price = priceLabel(product);

  return (
    <article className={`group ${className}`}>
      {/*
        `data-morph` は遷移の幕を出さない印（PageTransition）。一覧 ⇄ 商品ページは写真の
        モーフが主役なので、ページ全体を開く所作を重ねない。
      */}
      <Link
        href={productPath(product)}
        data-morph
        data-cursor="View"
        className="block no-underline outline-none focus-visible:ring-2 focus-visible:ring-ivory/25"
      >
        <ImageWell
          className={`relative overflow-hidden bg-sumi ${RATIO[LINE_RATIO[product.line]]}`}
          from={from}
          delay={revealDelay}
          overlay={sold ? <SoldBand className="inset-x-[8%] top-1/2 -translate-y-1/2" /> : null}
        >
          <ViewTransition name={`bag-${product.folder}`} share="morph" default="none">
            <Image
              src={productImage(product.slug, 1)}
              alt={`${product.name} — ${product.note}`}
              fill
              priority={priority}
              sizes={sizes}
              className={`object-cover transition-[transform,opacity] duration-[900ms] ease-[var(--ease-soft)] ${
                sold ? "opacity-45" : "group-hover:scale-[1.025]"
              }`}
            />
          </ViewTransition>
        </ImageWell>

        {/* 二列になるスマホでは、状態を名前の下へ落とす（横に並べると漢字が折れて三行になる）。 */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <h3 className="font-display text-[21px] font-light leading-none text-ivory sm:text-[23px]">
            {product.name}
            <span className="ml-2 whitespace-nowrap font-jp text-[11.5px] tracking-[0.12em] text-mist">
              {product.kanji}
            </span>
          </h3>
          {price ? (
            <p className="shrink-0 font-sans text-[13px] tabular-nums text-bone">{price}</p>
          ) : (
            <StatusPill status={product.status} className="shrink-0" />
          )}
        </div>
      </Link>
      {showNote ? (
        <p className="mt-2 max-w-[40ch] font-sans text-[13px] leading-[1.7] text-mist">{product.note}</p>
      ) : null}
    </article>
  );
}
