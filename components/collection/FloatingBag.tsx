"use client";

import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import type { CSSProperties } from "react";
import { productCutout, productPath, aud, type Product } from "@/data/products";
import { PieceSlug } from "./PieceSlug";
import { StatusPill } from "./StatusPill";

type Props = {
  product: Product;
  index?: number;
  priority?: boolean;
};

/**
 * 展示台（stage）はどの作品でも同じ 4:5。像だけが実物の比率で立つ。
 * 台の比率・接地線・キャプション位置を固定することで、並べたとき見え方が揃う。
 * 序列は台の大小ではなく hover（触れた一点が前に出る）で付ける。
 */
const STAGE_H_OVER_W = 5 / 4;
/** 台の高さに対する接地線の位置 */
const GROUND = 8;
/** 台の高さに対して像が占める割合。cutoutScale = 1（背の高いボトルバッグ）のとき */
const BAG_HEIGHT = 84;

export function FloatingBag({ product, index = 0, priority = false }: Props) {
  const delay = { "--delay": `${index * 90}ms` } as CSSProperties;

  // 像の高さは台の %、幅はそこから実比率で決まる。台幅を超えるものだけ幅で頭打ちにする。
  const bagH = BAG_HEIGHT * product.cutoutScale;
  const bagW = Math.min(92, bagH * STAGE_H_OVER_W * product.cutoutAspect);

  return (
    <article className="group flex h-full flex-col">
      <Link
        href={productPath(product)}
        className="block w-full no-underline outline-none focus-visible:ring-2 focus-visible:ring-ink/25"
        aria-label={`${product.name} — ${aud.format(product.priceAud)}`}
      >
        <div className="relative aspect-[4/5] w-full">
          <span
            aria-hidden
            style={{ ...delay, width: `${bagW * 0.66}%`, bottom: `${GROUND - 1.6}%` }}
            className="bag-ground absolute left-1/2 h-[2.4%] -translate-x-1/2 rounded-[50%] bg-ink/35 blur-[12px]"
          />
          <div
            className="bag-shadow-owner absolute left-1/2 -translate-x-1/2"
            style={{ height: `${bagH}%`, width: `${bagW}%`, bottom: `${GROUND}%` }}
          >
            <div className="bag-float relative h-full w-full" style={delay}>
              <div className="bag-lift relative h-full w-full">
                <ViewTransition name={`bag-${product.folder}`} share="morph" default="none">
                  <Image
                    src={productCutout(product.slug)}
                    alt={`${product.name} — ${product.note}`}
                    fill
                    priority={priority}
                    sizes="(min-width: 1280px) 30vw, (min-width: 640px) 46vw, 78vw"
                    className="object-contain object-bottom"
                  />
                </ViewTransition>
              </div>
            </div>
          </div>
        </div>
      </Link>

      <div className="mt-6 w-full">
        <StatusPill status={product.status} />
        <div className="mt-3 flex items-baseline justify-between gap-4">
          <Link href={productPath(product)} className="no-underline">
            <h3 className="font-display text-[27px] font-light leading-none tracking-[0.02em] text-ink">
              {product.name}
              <span className="ml-2 align-middle font-jp text-[13px] tracking-[0.24em] text-mist">{product.kanji}</span>
            </h3>
          </Link>
          <p className="shrink-0 font-sans text-[12.5px] tracking-[0.08em] text-charcoal/85">
            {aud.format(product.priceAud)}
          </p>
        </div>
        <PieceSlug product={product} className="mt-2" />
      </div>
    </article>
  );
}
