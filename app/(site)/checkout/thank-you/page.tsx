import type { Metadata } from "next";

import { Button } from "@/components/site/Button";
import { SHELL } from "@/components/site/Shell";
import { stripe } from "@/lib/stripe";
import { ClearCart } from "./ClearCart";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false, follow: false },
};

/**
 * 決済のあと。
 *
 * ここで注文を作らない —— 作るのは Webhook。客がこの画面まで戻ってこなくても
 * 注文は立っているし、この URL を後からもう一度開かれても二重にはならない。
 */
export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  let name: string | null = null;
  let email: string | null = null;

  const client = stripe();
  if (client && sessionId) {
    try {
      const session = await client.checkout.sessions.retrieve(sessionId);
      name = session.customer_details?.name ?? null;
      email = session.customer_details?.email ?? null;
    } catch (error) {
      console.error("[stripe] session の取得に失敗", error);
    }
  }

  return (
    <div className={`${SHELL} flex min-h-[78vh] items-center`}>
      <ClearCart />
      <section className="max-w-[54ch] py-24">
        <p className="eyebrow">Order received</p>
        <h1 className="mt-6 font-display text-[clamp(38px,5.6vw,72px)] font-light leading-[1.02] text-ink">
          {name ? `Thank you, ${name}.` : "Thank you."}
        </h1>
        <p className="mt-5 font-jp text-[12px] tracking-[0.24em] text-mist">ありがとうございます</p>

        <p className="mt-9 font-sans text-[15px] leading-[1.9] text-charcoal">
          The piece is yours. It leaves Honmyoji within a few days, wrapped by hand, and we write
          to you with the tracking number as soon as it is on its way.
          {email ? ` A receipt is on its way to ${email}.` : ""}
        </p>

        <p className="mt-5 max-w-[48ch] font-sans text-[13.5px] leading-[1.9] text-mist">
          Each bag is made from the edging of a single roll, so the one you chose will not be made
          again. If anything about the order needs changing, write back to us — a person reads it.
        </p>

        <div className="mt-11 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Button href="/collection" variant="outline">
            The collection
          </Button>
          <Button href="/contact" variant="link">
            Write to us
          </Button>
        </div>
      </section>
    </div>
  );
}
