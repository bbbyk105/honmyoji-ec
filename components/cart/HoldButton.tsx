"use client";

import { Button } from "@/components/site/Button";
import { useCart } from "./CartProvider";

/**
 * カートに入れる。買えるかどうかの判断は呼び出し側（`InquiryCta`、サーバー）が済ませてから
 * 置くので、ここが受け取るのは slug だけ —— Product を丸ごと client に渡さない。
 */
export function HoldButton({ slug }: { slug: string }) {
  const { add, has, setOpen } = useCart();
  const held = has(slug);

  return (
    <Button
      variant="solid"
      arrow
      onClick={() => {
        add(slug);
        setOpen(true);
      }}
    >
      {held ? "In cart — view" : "Add to cart"}
    </Button>
  );
}
