import { SHIPPING_AUD, shippingFor } from "@/data/shipping";
import { legal } from "@/data/site";

describe("shippingFor", () => {
  it("ふつうの作品は一注文 SHIPPING_AUD", () => {
    expect(shippingFor([{}, {}])).toBe(SHIPPING_AUD);
  });

  it("試し買い用だけの決済は 0、ふつうの作品が混ざれば送料あり", () => {
    expect(shippingFor([{ test: true }])).toBe(0);
    expect(shippingFor([{ test: true }, {}])).toBe(SHIPPING_AUD);
  });
});

describe("特商法の送料", () => {
  it("SHIPPING_AUD から組む（送料を変えたら表記も変わる）", () => {
    expect(legal.shipping).toContain(`A$${SHIPPING_AUD} per order`);
  });
});
