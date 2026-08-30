import Link from "next/link";
import { DriftBand } from "@/components/site/DriftBand";
import { Button } from "@/components/site/Button";
import { Frame } from "@/components/site/Frame";
import { Reveal } from "@/components/site/Reveal";
import { HomeHero } from "@/components/home/HomeHero";
import { FloatingBag } from "@/components/collection/FloatingBag";
import { StillTile } from "@/components/collection/StillTile";
import { productImage, products } from "@/data/products";
import { journal } from "@/data/journal";
import { founder, phrases } from "@/data/site";

const sakura = products.find((p) => p.folder === "sakura")!;
const ai = products.find((p) => p.folder === "ai")!;
const wakaba = products.find((p) => p.folder === "wakaba")!;
const musubi = products.find((p) => p.folder === "musubi")!;

export default function HomePage() {
  return (
    <>
      <HomeHero />

      {/* 2. Intro — text as a page, not a marketing block */}
      <section className="washi-grain relative">
        <div className="mx-auto grid w-full max-w-[1480px] gap-12 px-4 py-16 sm:px-5 sm:py-20 md:grid-cols-12 md:gap-8 md:px-8 md:py-28 lg:px-12">
          <Reveal className="md:col-span-7 lg:col-span-6">
            <p className="eyebrow">Atelier note</p>
            <h2 data-split-lines className="mt-5 font-display text-[clamp(32px,4.2vw,56px)] font-light leading-[1.08] text-ink">
              Objects woven from
              <br />
              a leftover edge.
            </h2>
          </Reveal>
          <Reveal delay={120} className="flex flex-col justify-end md:col-span-5 md:col-start-8 lg:col-span-4 lg:col-start-9">
            <p className="max-w-[38ch] font-sans text-[15px] leading-[1.85] text-charcoal/90">
              One-of-a-kind bags, made at a temple in Fuji City, from tatami-beri remnants and paper
              band recycled in the same streets. Each piece is finished by hand, offered a prayer,
              and not repeated.
            </p>
            <p className="mt-6 font-jp text-[12.5px] leading-[2] tracking-[0.04em] text-mist">
              {phrases.madeOnce.ja}
            </p>
          </Reveal>
        </div>
      </section>

      {/* 3. Featured — chosen, not a row of equal cards */}
      <section>
        <div className="mx-auto w-full max-w-[1480px] px-4 sm:px-5 md:px-8 lg:px-12">
          <Reveal className="flex items-end justify-between gap-6 border-b border-line pb-5">
            <div>
              <p className="eyebrow">Exhibition · 2026</p>
              <h2 data-split-lines className="mt-3 font-display text-[clamp(32px,3.8vw,48px)] font-light leading-none text-ink">
                Present pieces
              </h2>
            </div>
            <Button href="/collection" variant="link" className="mb-1">
              All nine
            </Button>
          </Reveal>

          {/* 三点とも同じ展示台。序列は大きさではなく hover（触れた一点が前に出る）で付ける。 */}
          <div className="mt-12 grid grid-cols-1 gap-14 sm:grid-cols-3 sm:gap-8 md:gap-10">
            {[sakura, ai, wakaba].map((piece, i) => (
              <Reveal key={piece.slug} delay={i * 80}>
                <FloatingBag product={piece} index={i} priority={i < 2} />
                <p className="mt-3 max-w-[34ch] font-sans text-[12.5px] leading-[1.75] text-charcoal/75">
                  {piece.note}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Material essay */}
      <section className="mt-28 md:mt-40">
        <div className="mx-auto grid w-full max-w-[1480px] gap-12 px-4 py-16 sm:px-5 md:grid-cols-12 md:items-start md:gap-8 md:px-8 md:py-24 lg:px-12">
          <Reveal className="md:col-span-5 md:sticky md:top-28">
            <p className="eyebrow">Material</p>
            <h2 data-split-lines className="mt-4 font-display text-[clamp(34px,4vw,52px)] font-light leading-[1.08] text-ink">
              A fabric that
              <br />
              once bordered
              <br />
              a room.
            </h2>
            <p className="mt-4 font-jp text-[13px] tracking-[0.2em] text-mist">{phrases.fabric.ja}</p>
          </Reveal>
          <div className="md:col-span-6 md:col-start-7">
            <Reveal>
              {/* 版面いっぱいに引き伸ばさない。原寸に近い倍率で置いたほうが織りが見える。 */}
              <Frame
                src="/images/texture/beri-indigo.webp"
                alt="Macro of indigo and moss tatami-beri over paper band"
                role="material-macro"
                ratio="4/5"
                caption="Ai — weave, close"
                className="max-w-[400px]"
                sizes="(min-width: 768px) 400px, 100vw"
              />
            </Reveal>
            <Reveal delay={80} className="mt-10 max-w-[46ch] space-y-5 font-sans text-[15px] leading-[1.9] text-charcoal/90">
              <p>
                Tatami-beri is the woven band sewn around a tatami mat — brocade chosen room by room.
                When a floor is remade, the bands are cut away. We take those remnants and weave them
                onto paper band made in Fuji from cartons and waste paper.
              </p>
              <p>
                The character <span className="font-jp text-ink">縁</span> is also read{" "}
                <em className="font-display text-[18px] italic">en</em>: a meeting. The bag begins
                there — leftover cloth, a city&apos;s recycled paper, a pair of hands at the temple.
              </p>
              <Button href="/journal/the-edge-that-remains" variant="link">
                Read the material note
              </Button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 縁が部屋を一周するように、縦に読むと横へ流れる帯。並べるのはバッグの写真だけ。 */}
      <DriftBand
        shots={[
          { src: productImage("sakura-cherry", 1), alt: "" },
          { src: "/images/scenes/bamboo-trio.webp", alt: "" },
          { src: productImage("ai-indigo", 1), alt: "" },
          { src: productImage("musubi-obi", 1), alt: "" },
          { src: productImage("sakura-cherry", 2), alt: "" },
          { src: productImage("hisui-jade", 1), alt: "" },
        ]}
      />

      {/* 5. Campaign / living objects */}
      <section className="mx-auto w-full max-w-[1480px] px-5 pt-6 md:px-8 md:pt-10 lg:px-12">
        <Reveal className="md:max-w-[36ch]">
          <p className="eyebrow">In place</p>
          <h2 data-split-lines className="mt-4 font-display text-[clamp(32px,3.6vw,46px)] font-light leading-[1.1] text-ink">
            How a piece sits in a day.
          </h2>
        </Reveal>
        {/*
          A: 横長の一枚と文章を、同じ天から始める。
          B: 縦位置を二枚、同じ高さで左右の端に揃える。
          （以前は 16:10 の隣に 3:4 を mt-16 でずらして置いていた。
            近いのに揃っていない配置は、意図ではなく揃え損ねに見える）
        */}
        <div className="mt-12 grid gap-8 md:grid-cols-12 md:gap-10">
          <Reveal className="md:col-span-8">
            <Frame
              src="/images/scenes/kimono-corridor.webp"
              alt="Walking the temple corridor in kimono, a bag at the hip"
              role="lifestyle"
              ratio="16/10"
              caption="Corridor, Honmyoji"
              sizes="(min-width: 768px) 64vw, 100vw"
            />
          </Reveal>
          <Reveal delay={100} className="flex flex-col justify-center md:col-span-4">
            <p className="font-display text-[clamp(24px,2.3vw,30px)] font-light leading-[1.3] text-ink">
              Not styled for a season. Made to be carried to a tea room, a market, a hallway at home.
            </p>
            <p className="mt-6 font-sans text-[14px] leading-[1.85] text-charcoal/85">
              The photographs here are from the precinct — hall, grove, corridor. Formal campaign
              pictures will replace them without changing the crops.
            </p>
            <Button href="/collection" variant="outline" className="mt-8 w-fit">
              See the nine
            </Button>
          </Reveal>
        </div>

        <div className="mt-8 grid gap-8 md:mt-10 md:grid-cols-12 md:gap-10">
          <Reveal className="md:col-span-5">
            <Frame
              src="/images/scenes/kimono-window.webp"
              alt="Seated at the temple window with two bags"
              role="lifestyle"
              ratio="4/5"
              caption="Window light"
              wellClass="aspect-[4/5] md:aspect-auto md:h-[clamp(420px,40vw,620px)]"
              sizes="(min-width: 768px) 40vw, 100vw"
            />
          </Reveal>
          <Reveal delay={80} className="md:col-span-5 md:col-start-8">
            <Frame
              src="/images/scenes/bamboo-trio.webp"
              alt="Three bags standing in the bamboo grove"
              role="lifestyle"
              ratio="3/4"
              caption="Bamboo grove behind the hall"
              wellClass="aspect-[3/4] md:aspect-auto md:h-[clamp(420px,40vw,620px)]"
              sizes="(min-width: 768px) 40vw, 100vw"
            />
          </Reveal>
        </div>
      </section>

      {/* 6. Craft */}
      <section className="mt-28 bg-parchment/70 md:mt-36">
        <div className="mx-auto grid w-full max-w-[1480px] gap-12 px-5 py-16 md:grid-cols-12 md:gap-8 md:px-8 md:py-24 lg:px-12">
          <Reveal className="md:col-span-5">
            <Frame
              src="/images/scenes/prayer-altar.webp"
              alt="Finished bags set before the altar"
              role="process"
              ratio="3/4"
              caption="After making — the hall"
              sizes="(min-width: 768px) 40vw, 100vw"
            />
          </Reveal>
          <Reveal delay={100} className="flex flex-col justify-center md:col-span-6 md:col-start-7">
            <p className="eyebrow">Making</p>
            <h2 data-split-lines className="mt-4 font-display text-[clamp(32px,3.8vw,48px)] font-light leading-[1.08] text-ink">
              One pair of hands,
              <br />
              one table, one week.
            </h2>
            <p className="mt-3 font-jp text-[13px] tracking-[0.18em] text-mist">一本ずつ、お寺で。</p>
            <div className="mt-8 max-w-[46ch] space-y-5 font-sans text-[15px] leading-[1.9] text-charcoal/90">
              <p>
                {founder.handmade.en}
              </p>
              <p>
                A finished piece is set down in the hall before it leaves. Then it belongs to
                whoever found it.
              </p>
            </div>
            <Button href="/about" variant="outline" className="mt-8 w-fit">
              The maker and the place
            </Button>
          </Reveal>
        </div>
      </section>

      {/* 7. Journal as publication, not a blog widget */}
      <section className="mx-auto w-full max-w-[1480px] px-5 py-20 md:px-8 md:py-28 lg:px-12">
        <Reveal className="flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Journal</p>
            <h2 data-split-lines className="mt-3 font-display text-[clamp(32px,3.8vw,48px)] font-light leading-none text-ink">
              Recent notes
            </h2>
          </div>
          <Button href="/journal" variant="link" className="mb-1">
            The archive
          </Button>
        </Reveal>

        <ol className="mt-12 max-w-[1040px] divide-y divide-line border-y border-line">
          {journal.slice(0, 3).map((entry, i) => (
            <Reveal key={entry.slug} as="li" delay={i * 60}>
              <Link
                href={`/journal/${entry.slug}`}
                className="group grid gap-x-8 gap-y-2 py-7 no-underline md:grid-cols-12"
              >
                <p className="font-sans text-[10px] uppercase leading-[1.9] tracking-[0.2em] text-mist md:col-span-2">
                  {entry.topic}
                  <span className="block text-mist/75">
                    {entry.season} · {entry.date.slice(0, 4)}
                  </span>
                </p>
                <div className="md:col-span-9">
                  <h3 className="font-display text-[26px] font-light leading-[1.2] text-ink">{entry.title}</h3>
                  <p className="mt-1.5 max-w-[52ch] font-sans text-[13.5px] leading-[1.75] text-charcoal/80">
                    {entry.dek}
                  </p>
                </div>
                <span
                  aria-hidden
                  className="hidden font-sans text-[15px] text-mist transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5 group-hover:text-ink md:col-span-1 md:block md:text-right"
                >
                  →
                </span>
              </Link>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* quiet closing piece, not a CTA banner */}
      <section className="mx-auto w-full max-w-[1480px] px-5 pb-8 md:px-8 lg:px-12">
        <Reveal className="grid gap-8 border-t border-line pt-10 md:grid-cols-12">
          <p className="font-display text-[clamp(22px,2.6vw,32px)] font-light leading-[1.35] text-ink md:col-span-7">
            {phrases.noTwo.en}
          </p>
          <div className="md:col-span-4 md:col-start-9">
            <StillTile product={musubi} ratio="1/1" />
          </div>
        </Reveal>
      </section>
    </>
  );
}
