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
 * 展示台（stage）はどの作品でも同じ 4:5。像だけが実物の比率で立つ。
 * 台の比率・接地線・キャプション位置を固定することで、並べたとき見え方が揃う。
 * 序列は台の大小ではなく hover（触れた一点が前に出る）で付ける。
 */
const STAGE_H_OVER_W = 5 / 4;
/** 台の高さに対する接地線の位置 */
const GROUND = 8;
/**
 * 棚板の左右の入り。九点とも同じ値で引くので、一列が一枚の板に見える。
 * 像の幅は 37〜71%（sakura が一番細く ichimatsu が一番太い）ので、88% あれば
 * どの作品も板からはみ出さない。板のほうを揃えるのが台の役目 —— 像に合わせて
 * 一点ずつ長さを変えると、九点並べたときに板がばらけて棚に見えなくなる。
 */
const SHELF_INSET = 6;
/** 台の高さに対して像が占める割合。cutoutScale = 1（背の高いボトルバッグ）のとき */
const BAG_HEIGHT = 84;

export function FloatingBag({ product, index = 0, priority = false }: Props) {
  const delay = { "--delay": `${index * 90}ms` } as CSSProperties;
  /* 完売は像を淡くして、hover でも前に出さない — 触れて反応するものは買えるもの、で揃える。 */
  const sold = product.status === "sold_out";

  // 像の高さは台の %、幅はそこから実比率で決まる。台幅を超えるものだけ幅で頭打ちにする。
  const bagH = BAG_HEIGHT * product.cutoutScale;
  const bagW = Math.min(92, bagH * STAGE_H_OVER_W * product.cutoutAspect);

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
