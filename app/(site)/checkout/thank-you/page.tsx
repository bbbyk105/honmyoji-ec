import type { Metadata } from "next";

import { Button } from "@/components/site/Button";
import { SHELL } from "@/components/site/Shell";
import { isLang, type Lang } from "@/lib/lang";
import { stripe } from "@/lib/stripe";
import { ClearCart } from "./ClearCart";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false, follow: false },
};

/**
 * Stripe の Checkout Session の ID の形。形の違う値では Stripe を呼ばない —— この画面は
 * 誰でも開けるので、でたらめな値ごとに店の鍵で Stripe の API を叩かせない（監査 16）。
 */
const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;

/**
 * 決済のあと。
 *
 * ここで注文を作らない —— 作るのは Webhook。客がこの画面まで戻ってこなくても
 * 注文は立っているし、この URL を後からもう一度開かれても二重にはならない。
 *
 * 言語は決済を始めたときに決めたもの（決済の metadata.lang、`lib/lang.ts`）。確認メールと
 * 同じ言葉で書いてある（`lib/order-mail.ts` の `orderConfirmationMail`）。
 */
export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  let name: string | null = null;
  let email: string | null = null;
  let lang: Lang = "en";

  const client = stripe();
  if (client && sessionId && SESSION_ID.test(sessionId)) {
    try {
      const session = await client.checkout.sessions.retrieve(sessionId);
      name = session.customer_details?.name ?? null;
      email = session.customer_details?.email ?? null;
      if (isLang(session.metadata?.lang)) lang = session.metadata.lang;
    } catch (error) {
      console.error("[stripe] session の取得に失敗", error);
    }
  }

  if (lang === "ja") {
    return (
      <div className={`${SHELL} flex min-h-[78vh] items-center`}>
        <ClearCart />
        {/* 和文は ch で測らない（DESIGN.md の Measure）。一行およそ 34 字 */}
        <section lang="ja" className="max-w-[560px] py-24">
          <p className="eyebrow font-jp">ご注文を承りました</p>
          <h1 className="mt-6 font-jp text-display font-light leading-[1.35] text-ivory">
            {name ? (
              <>
                {name} 様、
                <br />
                ありがとうございます。
              </>
            ) : (
              "ありがとうございます。"
            )}
          </h1>
          <p lang="en" className="mt-5 font-display text-[15px] font-light tracking-[0.04em] text-mist">
            Thank you.
          </p>

          <p className="mt-10 font-jp text-body leading-[2] text-bone">
            作品は数日のうちに、本妙寺から手で包んでお送りします。発送しましたら、追跡番号をメールでお知らせします。
            {email ? `ご注文の確認メールを ${email} にお送りしました。` : ""}
          </p>

          <p className="mt-5 font-jp text-small leading-[2] text-mist">
            バッグはどれも、ひと巻きの畳縁から一つずつ作っています。お選びいただいたものと同じ作品は、二度と作られません。ご注文について変えたいことがあれば、お気軽にご連絡ください。寺の者が読んでお返事します。
          </p>

          <div className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4">
            <Button href="/collection">作品一覧へ</Button>
            <Button href="/contact">お問い合わせ</Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={`${SHELL} flex min-h-[78vh] items-center`}>
      <ClearCart />
      <section className="max-w-[54ch] py-24">
        <p className="eyebrow">Order received</p>
        <h1 className="mt-6 font-display text-display font-light text-ivory">
          {name ? `Thank you, ${name}.` : "Thank you."}
        </h1>
        <p lang="ja" className="mt-5 font-jp text-[15px] tracking-[0.06em] text-mist">ありがとうございます</p>

        <p className="mt-10 font-sans text-body text-bone">
          The piece is yours. It leaves Honmyoji within a few days, wrapped by hand, and we write
          to you with the tracking number as soon as it is on its way.
          {email ? ` A confirmation of your order is on its way to ${email}.` : ""}
        </p>

        <p className="mt-5 max-w-[48ch] font-sans text-small text-mist">
          Each bag is made from the edging of a single roll, so the one you chose will not be made
          again. If anything about the order needs changing, write back to us — a person reads it.
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4">
          <Button href="/collection">The collection</Button>
          <Button href="/contact">Write to us</Button>
        </div>
      </section>
    </div>
  );
}
