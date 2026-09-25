import type { Metadata } from "next";
import { Button } from "@/components/site/Button";
import { Frame } from "@/components/site/Frame";
import { Reveal } from "@/components/site/Reveal";
import { SHELL } from "@/components/site/Shell";
import { faq, founder } from "@/data/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "MIROKU is made at Honmyoji Temple in Fuji City by Emi Kashiwazake — tatami-beri remnants, recycled paper band, one piece at a time.",
};

/*
  面（2026-09-25）。表題と床の間の写真は墨の部屋、創業者の文章と作る理由は紙 —— 長い文章は
  紙の上のほうが読める。堂の写真・富士の夕暮れ・結びでまた墨に戻り、そのままフッターへ。
*/
export default function AboutPage() {
  return (
    <>
      <section className="pt-16 sm:pt-[72px] md:pt-[80px]">
        <div className={`${SHELL} grid gap-10 pt-14 md:grid-cols-12 md:items-end md:gap-8 md:pt-24`}>
          <div className="md:col-span-7">
            <h1 className="font-display text-display font-light text-ivory">
              A temple table,
              <br />
              a leftover edge.
            </h1>
          </div>
          <p className="max-w-[38ch] font-sans text-body text-bone md:col-span-5 md:col-start-8 md:pb-3">
            MIROKU is a small making practice at Honmyoji, Fuji City. Bags are woven one by one from
            tatami-beri remnants and paper band recycled in the same city. Not a line. A sequence of
            encounters.
          </p>
        </div>
        <div className={`${SHELL} mt-lead pb-pause`}>
          <Frame
            src="/images/scenes/tokonoma.webp"
            alt="The tokonoma alcove at Honmyoji, a hanging scroll above a small statue"
            role="lifestyle"
            ratio="16/10"
            crop="object-cover object-[50%_46%]"
            priority
            sizes="(min-width: 1480px) 1384px, 100vw"
          />
        </div>
      </section>

      <div className="surface-paper">
        <section className={`${SHELL} pt-pause`}>
          <div className="grid gap-16 md:grid-cols-12 md:gap-8">
            <Reveal className="md:col-span-6 lg:col-span-5">
              <h2 data-split-lines className="font-display text-section font-light text-ivory">
                {founder.name}
              </h2>
              <p lang="ja" className="mt-4 font-jp text-[16px] tracking-[0.08em] text-bone">{founder.nameJa}</p>
              <p className="mt-3 font-sans text-meta text-mist">{founder.title}</p>

              <h3 className="mt-16 font-display text-title font-light text-ivory">How the bag began</h3>
              <div className="mt-6 max-w-[52ch] space-y-5 font-sans text-body text-bone">
                {founder.origin.en.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <div lang="ja" className="mt-10 max-w-[30em] space-y-4 border-t border-line pt-8 font-jp text-[14px] leading-[2.05] text-mist">
                {founder.origin.ja.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </Reveal>

            {/* 年表は左の細い列に押し込まず、独立した「経歴」として読ませる。表は動かさない */}
            <div className="md:col-span-6 md:col-start-7 lg:col-span-6 lg:col-start-7">
              <h3 className="font-display text-title font-light text-ivory">Practice</h3>
              <dl className="mt-8 border-t border-line">
                {founder.timeline.map((t) => (
                  <div key={t.years} className="grid gap-x-8 gap-y-2 border-b border-line py-7 sm:grid-cols-[96px_1fr]">
                    <dt className="font-display text-[18px] tabular-nums leading-[1.5] text-ivory">{t.years}</dt>
                    <dd className="max-w-[52ch] font-sans text-small text-bone">{t.en}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section className={`${SHELL} grid gap-12 pb-pause pt-pause md:grid-cols-12 md:gap-8`}>
          <div className="md:col-span-5">
            <Frame
              src="/images/scenes/hands-front.webp"
              alt="Hands holding a woven bottle bag by its handle"
              role="lifestyle"
              ratio="3/4"
              crop="object-cover object-[50%_60%]"
              from="left"
              sizes="(min-width: 768px) 40vw, 100vw"
            />
          </div>
          <Reveal delay={80} className="flex flex-col justify-center md:col-span-5 md:col-start-8">
            <h3 data-split-lines className="font-display text-section font-light text-ivory">
              {founder.reasons.title}
            </h3>
            <ul className="mt-10 space-y-6">
              {founder.reasons.en.map((r) => (
                <li key={r} className="max-w-[48ch] font-sans text-body text-bone">
                  {r}
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      </div>

      <section className={`${SHELL} grid gap-12 pt-pause md:grid-cols-12 md:gap-8`}>
        <Reveal className="order-2 flex flex-col justify-center md:order-1 md:col-span-5">
          <h3 data-split-lines className="font-display text-section font-light text-ivory">
            Made in a working temple.
          </h3>
          <div className="mt-8 max-w-[48ch] space-y-5 font-sans text-body text-bone">
            <p>{faq[5].a[0]}</p>
            <p>{faq[5].a[1]}</p>
            <p>
              {faq[6].a[0]} {faq[6].a[1]}
            </p>
          </div>
        </Reveal>
        <div className="order-1 md:order-2 md:col-span-6 md:col-start-7">
          <Frame
            src="/images/scenes/hall-portrait.webp"
            alt="In the temple hall, holding the Hishi handbag"
            role="process"
            ratio="4/5"
            crop="object-cover object-[50%_40%]"
            from="right"
            sizes="(min-width: 768px) 45vw, 100vw"
          />
        </div>
      </section>

      {/*
        場所。富士山を版面いっぱいの横長一枚で置く。以前は作品の寄りと iPhone の富士山（鉄塔入り）を
        正方形で二枚並べていて、二枚が互いに何も言っていなかった（2026-09-25）。
        写真は Unsplash（富士宮から・夕暮れ）—— 手前の稜線が暗く沈むので、墨の地にそのまま溶ける。
        スマホで 21:9 にすると高さ 160px の帯になって山が小さいので、3:2 に起こす。
      */}
      <section className={`${SHELL} pt-pause`}>
        <Frame
          src="/images/stock/fuji-dusk.webp"
          alt="Mount Fuji at dusk, seen from Fujinomiya, Shizuoka"
          role="lifestyle"
          ratio="16/9"
          wellClass="aspect-[3/2] md:aspect-[21/9]"
          crop="object-cover object-[50%_42%]"
          sizes="(min-width: 1480px) 1384px, 100vw"
        />
      </section>

      <section className={`${SHELL} pb-pause pt-breath`}>
        {/* 締めも二段組にする。一本の細い柱だけ立てると、右に版面の半分が空く */}
        <div className="grid gap-12 border-t border-line pt-14 md:grid-cols-12 md:gap-8">
          <Reveal className="md:col-span-5">
            <h2 data-split-lines className="font-display text-section font-light text-ivory">
              {founder.handmade.title}
            </h2>
            <p lang="ja" className="mt-5 font-jp text-[16px] tracking-[0.08em] text-mist">{founder.handmade.titleJa}</p>
            <Button href="/collection" className="mt-10">
              The collection
            </Button>
          </Reveal>
          <Reveal delay={90} className="md:col-span-6 md:col-start-7">
            <p className="max-w-[52ch] font-sans text-body text-bone">{founder.handmade.en}</p>
            {/*
              創業者の言葉。斜体にしない（2026-09-25）—— 細いイタリックは「高級そうに見せる書体」の
              定番で、ここだけ別の人の声のように浮いていた。見出しと同じ立体の Newsreader で、
              大きさと余白だけで引用として立てる。
            */}
            <p className="mt-14 max-w-[30ch] font-display text-[clamp(24px,1.4vw+12px,34px)] font-light leading-[1.4] tracking-[-0.01em] text-ivory">
              {founder.message.en}
            </p>
            <p className="mt-6 font-sans text-meta text-mist">— {founder.name}</p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
