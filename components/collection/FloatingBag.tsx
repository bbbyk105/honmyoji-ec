"use client";

import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import type { CSSProperties } from "react";
import { productCutout, productPath, aud, type Product } from "@/data/products";
import { SoldBand } from "./SoldBand";
import { StatusPill } from "./StatusPill";

type Props = {
  product: Product;
  index?: number;
  priority?: boolean;
};

/**
 * 展示台（stage）はどの作品でも同じ 4:5。像は実物の**縦横比**で立つが、**背丈は揃える**
 * （2026-09-16）。台の比率・接地線・背丈・キャプション位置を固定してあるので、
 * 並べたとき変わるのは織りだけになる。
 * 序列は大小ではなく hover（触れた一点が前に出る）で付ける。
 */
const STAGE_H_OVER_W = 5 / 4;
/** 台の高さに対する接地線の位置 */
const GROUND = 8;
/**
 * 棚板の左右の入り。九点とも同じ値で引くので、一列が一枚の板に見える。
 * 板のほうを揃えるのが台の役目 —— 像に合わせて一点ずつ長さを変えると、
 * 九点並べたときに板がばらけて棚に見えなくなる。背丈を揃えた結果、像の幅は
 * 29〜88%（sakura が一番細く、musubi と ichimatsu が板いっぱい）になる。
 */
const SHELF_INSET = 6;
/**
 * 九点とも同じ背丈で立たせる。実寸の大小は像の側では言わない —— 図版は同じ大きさで刷り、
 * 寸法は下の SPEC が数字で言う、という展示図録の並べ方（2026-09-16）。
 * 値は以前 sakura が立っていた高さそのもの（84 × 0.926）なので、一番背の高い一点は動かない。
 */
const BAG_HEIGHT = 78;
/** 棚板の長さ。横に太い作品は背丈ではなくここで頭打ちになる（板からはみ出させない）。 */
const SHELF_SPAN = 100 - SHELF_INSET * 2;

export function FloatingBag({ product, index = 0, priority = false }: Props) {
  const delay = { "--delay": `${index * 90}ms` } as CSSProperties;
  /* 完売は像を淡くして、hover でも前に出さない — 触れて反応するものは買えるもの、で揃える。 */
  const sold = product.status === "sold_out";

  /*
    背丈は九点とも BAG_HEIGHT。幅はそこから実比率で決まる。
    ただし musubi（帯・横長）と ichimatsu は同じ背丈だと板をはみ出すので、そこだけ
    板の長さで頭打ちにする —— はみ出させるくらいなら、その二点だけ低く立たせる。
  */
  const wide = STAGE_H_OVER_W * product.cutoutAspect;
  const bagH = Math.min(BAG_HEIGHT, SHELF_SPAN / wide);
  const bagW = bagH * wide;

  return (
    <article className="group flex h-full flex-col">
      <Link
        href={productPath(product)}
        className="block w-full no-underline outline-none focus-visible:ring-2 focus-visible:ring-ivory/25"
        aria-label={`${product.name} — ${aud.format(product.priceAud)}`}
      >
        <div className="relative aspect-[4/5] w-full">
          {/*
            棚板。接地は光ではなく線で作る —— 黒地に影は写らず、ぼかした面や光だまりは
            結局グラデーションになる。`bottom` は接地線そのものなので、像は板の上に載る
            （1px ぶん像の裾と重なるのが正しい。浮かせると板と像の間に隙間が見える）。
            触れた一点だけ板が明るくなり、序列は hover が持つ —— 台の大小では付けない。
          */}
          <span
            aria-hidden
            style={{ bottom: `${GROUND}%`, left: `${SHELF_INSET}%`, right: `${SHELF_INSET}%` }}
            className={`pointer-events-none absolute h-px transition-colors duration-700 ease-[var(--ease-soft)] ${
              sold ? "bg-ivory/12" : "bg-ivory/25 group-hover:bg-ivory/45 group-focus-within:bg-ivory/45"
            }`}
          />
          <div
            className="bag-shadow-owner absolute left-1/2 -translate-x-1/2"
            style={{ height: `${bagH}%`, width: `${bagW}%`, bottom: `${GROUND}%` }}
          >
            <div className="bag-float relative h-full w-full" style={delay}>
              <div className={`relative h-full w-full ${sold ? "" : "bag-lift"}`}>
                <ViewTransition name={`bag-${product.folder}`} share="morph" default="none">
                  <Image
                    src={productCutout(product.slug)}
                    alt={`${product.name} — ${product.note}`}
                    fill
                    priority={priority}
                    sizes="(min-width: 1280px) 30vw, (min-width: 640px) 46vw, 78vw"
                    className={`object-contain object-bottom ${sold ? "opacity-55" : ""}`}
                  />
                </ViewTransition>
              </div>
            </div>
          </div>
          {sold ? (
            <SoldBand className="inset-x-[7%] translate-y-1/2" style={{ bottom: `${GROUND + bagH / 2}%` }} />
          ) : null}
        </div>
      </Link>

      <div className="mt-6 w-full">
        <StatusPill status={product.status} />
        <div className="mt-3 flex items-baseline justify-between gap-4">
          <Link href={productPath(product)} className="no-underline">
            <h3 className="font-display text-[27px] font-light leading-none tracking-[0.02em] text-ivory">
              {product.name}
              <span className="ml-2 align-middle font-jp text-[13px] tracking-[0.24em] text-mist">{product.kanji}</span>
            </h3>
          </Link>
          <p className="shrink-0 font-sans text-[12.5px] tracking-[0.08em] text-bone/85">
            {aud.format(product.priceAud)}
          </p>
        </div>
      </div>
    </article>
  );
}
