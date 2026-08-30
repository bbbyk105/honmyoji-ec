import type { Product } from "@/data/products";

export function PieceSlug({ product, className = "" }: { product: Product; className?: string }) {
  return (
    <p
      className={`font-sans text-[14px] font-medium leading-none tracking-[0.01em] text-charcoal sm:text-[15px] ${className}`}
    >
      <span className="text-mist">/</span>
      {product.slug}
    </p>
  );
}
