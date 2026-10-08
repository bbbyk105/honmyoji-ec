import { render, screen } from "@testing-library/react";
import { useEffect } from "react";

import { CartProvider, useCart } from "@/components/cart/CartProvider";
import { MiniCart } from "@/components/cart/MiniCart";
import { products, toCartPiece } from "@/data/products";

// 決済の Server Action はサーバーのモジュール（next/headers・DB）を読むので、ここでは差し替える
jest.mock("@/app/(site)/checkout/actions", () => ({ startCheckout: jest.fn(async () => ({})) }));

const piece = { ...toCartPiece(products[0]), status: "available" as const, priceAud: 145 };

/** カートに一点入れて開いた状態にする。 */
function Open() {
  const { setOpen } = useCart();
  useEffect(() => setOpen(true), [setOpen]);
  return null;
}

function setLanguages(languages: string[]) {
  Object.defineProperty(window.navigator, "languages", { value: languages, configurable: true });
}

function renderCart() {
  localStorage.setItem("miroku-held", JSON.stringify([piece.slug]));
  return render(
    <CartProvider catalog={[piece]}>
      <Open />
      <MiniCart canCheckout />
    </CartProvider>,
  );
}

afterEach(() => {
  localStorage.clear();
  setLanguages(["en-US", "en"]);
});

describe("MiniCart の言語", () => {
  it("ブラウザが日本語なら日本語で出し、決済のフォームで ja を送る", async () => {
    setLanguages(["ja", "en-US"]);
    const { container } = renderCart();

    expect(await screen.findByText("購入手続きへ")).toBeTruthy();
    expect(screen.getByText("小計")).toBeTruthy();
    expect(container.querySelector('input[name="lang"]')?.getAttribute("value")).toBe("ja");
    expect(container.querySelector('[lang="ja"]')).toBeTruthy();
  });

  it("ブラウザが日本語以外なら英語で出し、en を送る", async () => {
    setLanguages(["en-AU", "ja"]);
    const { container } = renderCart();

    expect(await screen.findByText("Check out")).toBeTruthy();
    expect(screen.getByText("Subtotal")).toBeTruthy();
    expect(container.querySelector('input[name="lang"]')?.getAttribute("value")).toBe("en");
  });
});
