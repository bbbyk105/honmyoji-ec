import { isPurchasable, type Product } from "@/data/products";
import { Button } from "@/components/site/Button";
import { HoldButton } from "./HoldButton";

/**
 * 商品ページの主導線。買えるもの（`available`）はカートへ、それ以外は Contact へ。
 *
 * Server Component。分岐はここで済ませ、client に降りるのはカートのボタン（slug だけ）。
 * 以前は `HoldButton.tsx` の中にあって、分岐ごと client に載り、Product も丸ごと渡っていた。
 */
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
    return <HoldButton slug={product.slug} />;
  }
  return (
    <Button href={href} variant={variant}>
      {label}
    </Button>
  );
}
