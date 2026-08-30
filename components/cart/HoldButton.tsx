"use client";

import { isPurchasable, type Product } from "@/data/products";
import { Button } from "@/components/site/Button";
import { useCart } from "./CartProvider";

export function HoldButton({ product }: { product: Product }) {
  const { add, has, setOpen } = useCart();
  const held = has(product.slug);

  if (!isPurchasable(product)) return null;

  return (
    <Button
      variant="solid"
      arrow
      onClick={() => {
        add(product.slug);
        setOpen(true);
      }}
    >
      {held ? "In cart — view" : "Add to cart"}
    </Button>
  );
}

export function InquiryCta({
  product,
  href,
  label,
  variant = "outline",
}: {
  product: Product;
  href: string;
  label: string;
  variant?: "outline" | "solid";
}) {
  if (isPurchasable(product)) {
    return <HoldButton product={product} />;
  }
  return (
    <Button href={href} variant={variant}>
      {label}
    </Button>
  );
}
