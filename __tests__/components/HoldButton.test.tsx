import { act, fireEvent, render, screen } from "@testing-library/react";

import { CartProvider, useCart } from "@/components/cart/CartProvider";
import { HoldButton } from "@/components/cart/HoldButton";
import { products, toCartPiece } from "@/data/products";

const STORAGE_KEY = "miroku-held";
const catalog = products.map(toCartPiece);

/** カートの中身を覗く。MiniCart と同じく `pieces` を読む。 */
function Peek() {
  const { pieces, open } = useCart();
  return (
    <p data-testid="peek">
      {open ? "open" : "closed"}:{pieces.map((p) => p.slug).join(",")}
    </p>
  );
}

function renderCart(slug: string) {
  return render(
    <CartProvider catalog={catalog}>
      <HoldButton slug={slug} />
      <Peek />
    </CartProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("HoldButton × CartProvider", () => {
  it("押すと slug でカートに入り、カートが開く", () => {
    renderCart("ai-indigo");
    expect(screen.getByRole("button")).toHaveProperty("textContent", expect.stringContaining("Add to cart"));

    fireEvent.click(screen.getByRole("button"));

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")).toEqual(["ai-indigo"]);
    expect(screen.getByTestId("peek").textContent).toBe("open:ai-indigo");
    expect(screen.getByRole("button").textContent).toContain("In cart — view");
  });

  it("旧 folder 名で入っているカートも「入っている」と数える", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["sakura"]));
    renderCart("sakura-cherry");

    expect(screen.getByRole("button").textContent).toContain("In cart — view");
    expect(screen.getByTestId("peek").textContent).toBe("closed:sakura-cherry");

    // 二度押しても二重に入らない
    act(() => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")).toEqual(["sakura"]);
  });

  it("カタログから消えた品は pieces に出さない", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["gone", "matsu-pine"]));
    renderCart("matsu-pine");
    expect(screen.getByTestId("peek").textContent).toBe("closed:matsu-pine");
  });
});
