import Image from "next/image";
import Link from "next/link";
import { ImageWell } from "@/components/site/ImageWell";
import { productImage, productPath, usd, type Product } from "@/data/products";
import { PieceSlug } from "./PieceSlug";
import { StatusPill } from "./StatusPill";

type Props = {
  product: Product;
  ratio?: "4/5" | "1/1" | "3/4";
  priority?: boolean;
  className?: string;
};

const RATIO = {
  "4/5": "aspect-[4/5]",
  "1/1": "aspect-square",
  "3/4": "aspect-[3/4]",
};

export function StillTile({ product, ratio = "4/5", priority = false, className = "" }: Props) {
  return (
    <article className={`group ${className}`}>
      <Link
        href={productPath(product)}
        className="block no-underline outline-none focus-visible:ring-2 focus-visible:ring-ink/25"
      >
        <ImageWell
          className={`relative overflow-hidden bg-parchment ${RATIO[ratio]}`}
          reveal="wipe"
        >
          <Image
            src={productImage(product.slug, 1)}
            alt={`${product.name} — ${product.note}`}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 40vw, 90vw"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
          />
        </ImageWell>
        <div className="mt-4 flex items-baseline justify-between gap-4">
          <div>
            <StatusPill status={product.status} />
            <h3 className="mt-2 font-display text-[26px] font-light leading-none text-ink">
              {product.name}
              <span className="ml-2 font-jp text-[12px] tracking-[0.2em] text-mist">{product.kanji}</span>
            </h3>
            <PieceSlug product={product} className="mt-1.5" />
          </div>
          <p className="shrink-0 font-sans text-[12px] tracking-[0.08em] text-charcoal/80">
            {usd.format(product.priceUsd)}
          </p>
        </div>
      </Link>
    </article>
  );
}
