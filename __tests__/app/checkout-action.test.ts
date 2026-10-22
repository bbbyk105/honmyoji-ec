/**
 * @jest-environment node
 */

// 決済を作るとき、届け先の国は data/shipping.ts の SHIPPING_COUNTRIES だけ。
// オーストラリア以外を Stripe に出さない。

export {};

const getPieces = jest.fn();
const create = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("next/headers", () => ({
  headers: async () => new Headers({ host: "localhost:3000", "accept-language": "en" }),
}));
jest.mock("next/navigation", () => ({
  redirect: (url: string) => {
    const error = new Error(`REDIRECT ${url}`);
    (error as { digest?: string }).digest = "NEXT_REDIRECT";
    throw error;
  },
}));
jest.mock("@/lib/catalog", () => ({
  getPieces: (...args: unknown[]) => getPieces(...args),
  toCents: (aud: number) => Math.round(aud * 100),
}));
jest.mock("@/lib/stripe", () => ({
  stripe: () => ({ checkout: { sessions: { create: (...args: unknown[]) => create(...args) } } }),
}));

type Actions = typeof import("@/app/(site)/checkout/actions");
const { startCheckout } = jest.requireActual<Actions>("@/app/(site)/checkout/actions");

const piece = {
  slug: "tokiwa-evergreen",
  folder: "bottle-01",
  sku: "MI-BAG-001",
  name: "Tokiwa",
  kanji: "常磐",
  note: "A green bottle bag",
  priceAud: 145,
  status: "available" as const,
};

function form(): FormData {
  const data = new FormData();
  data.set("slugs", piece.slug);
  data.set("lang", "en");
  return data;
}

beforeEach(() => {
  getPieces.mockReset();
  create.mockReset();
  getPieces.mockResolvedValue([piece]);
  create.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_test_example" });
});

describe("startCheckout の発送先", () => {
  it("Stripe の届け先はオーストラリアだけ。送料は A$40", async () => {
    await expect(startCheckout({}, form())).rejects.toThrow("REDIRECT");

    expect(create).toHaveBeenCalledTimes(1);
    const params = create.mock.calls[0][0] as {
      shipping_address_collection: { allowed_countries: string[] };
      shipping_options: { shipping_rate_data: { fixed_amount: { amount: number; currency: string } } }[];
    };
    expect(params.shipping_address_collection.allowed_countries).toEqual(["AU"]);
    expect(params.shipping_options[0].shipping_rate_data.fixed_amount).toEqual({ amount: 4000, currency: "aud" });
  });
});
