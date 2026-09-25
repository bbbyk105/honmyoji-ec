import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { ImageWell, type WellFrom, type WellReveal } from "@/components/site/ImageWell";
import { LINE_RATIO, priceLabel, productImage, productPath, type Product } from "@/data/products";
import { SoldBand } from "./SoldBand";
import { StatusPill } from "./StatusPill";

type Props = {
  product: Product;
  priority?: boolean;
  sizes?: string;
  /** 一言を名前の下に添えるか。既定は添えない（写真 → 名前 → 状態の三段で止める）。 */
  showNote?: boolean;
  from?: WellFrom;
  /** 写真の開き方。一覧の格子のように何十枚も並ぶところでは "none"（置いてあるだけ）。 */
  reveal?: WellReveal;
  revealDelay?: number;
  className?: string;
};

const RATIO = { "4/5": "aspect-[4/5]", "3/2": "aspect-[3/2]" } as const;

/**
 * 作品の一枚。一覧・トップ・関連作品はすべてこれ。
 *
 * **カードにしない。** 枠・影・角丸・地の板を持たず、写真がそのまま展示の一点になる。
 * 下に置くのは名前（Newsreader）と、価格か状態（小さな sans）の二行だけ（2026-09-25）。
 * 以前は一言の説明まで三行並べていて、二十六点の格子が文字の壁になっていた —— 説明は
 * 作品のページと alt が持っている。
 *
 * 写真はカメラマンの撮影そのまま。立つ作品は 4:5 で**背丈を揃えて**切ってあり
 * （`scripts/prepare-photos.py`）、同じ床・同じ障子の前に並ぶので、一列が一つの部屋に見える。
 * 触れたときは像が 2% だけ寄る（井戸の中で切られるので、枠は動かない）。
 *
 * `bag-{folder}` の名前で商品ページのヒーローへモーフする。同じ写真・同じ比率なので、
 * 枠が大きくなるだけで像は歪まない。
 */
export function PieceTile({
  product,
  priority = false,
  sizes = "(min-width: 1280px) 24vw, (min-width: 768px) 32vw, 48vw",
  showNote = false,
  from = "bottom",
  reveal = "wipe",
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
        className="block no-underline outline-none focus-visible:ring-1 focus-visible:ring-ivory/40 focus-visible:ring-offset-4 focus-visible:ring-offset-sumi"
      >
        <ImageWell
          className={`relative overflow-hidden bg-sumi ${RATIO[LINE_RATIO[product.line]]}`}
          from={from}
          reveal={reveal}
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
              className={`object-cover transition-[transform,opacity] duration-[1100ms] ease-[var(--ease-soft)] ${
                sold ? "opacity-45" : "group-hover:scale-[1.02]"
              }`}
            />
          </ViewTransition>
        </ImageWell>

        <div className="mt-5">
          <h3 className="font-display text-piece font-light text-ivory">
            {product.name}
            <span lang="ja" className="ml-2.5 whitespace-nowrap font-jp text-[13px] tracking-[0.04em] text-mist">
              {product.kanji}
            </span>
          </h3>
          <p className="mt-2 font-sans text-meta">
            {price ? (
              <span className="tabular-nums text-bone">{price}</span>
            ) : (
              <StatusPill status={product.status} />
            )}
          </p>
        </div>
      </Link>
      {showNote ? (
        <p className="mt-2 max-w-[40ch] font-sans text-meta text-mist">{product.note}</p>
      ) : null}
    </article>
  );
}
