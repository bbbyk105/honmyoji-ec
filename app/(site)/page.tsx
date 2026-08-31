import Link from "next/link";
import { DriftBand } from "@/components/site/DriftBand";
import { Button } from "@/components/site/Button";
import { Frame } from "@/components/site/Frame";
import { Reveal } from "@/components/site/Reveal";
import { SHELL } from "@/components/site/Shell";
import { SwipeStrip } from "@/components/site/SwipeStrip";
import { HomeHero } from "@/components/home/HomeHero";
import { FloatingBag } from "@/components/collection/FloatingBag";
import { StillTile } from "@/components/collection/StillTile";
import { productImage } from "@/data/products";
import { getCatalog } from "@/lib/catalog";
import { blogMeta } from "@/data/blog";
import { blogHref, getBlogPosts } from "@/lib/microcms";
import { founder, phrases } from "@/data/site";

/*
  縦のリズム。DESIGN.md は 80–160px、ただし同じ数字の繰り返しにはしない。
  以前は mt-40 と py-24 が重なって 256px 空く箇所と、112px の箇所が混在していた。
  余白は「片側だけ」持たせる — 背景を敷くセクション（Intro / Craft）だけが
  自分の内側に上下の余白を持ち、それ以外は上だけ持つ。
*/

export default async function HomePage() {
  /* トップに出す四点。カタログ経由で引くので、管理画面で直した価格と
     ステータスがそのまま出る（folder 名は写真のフォルダなので変わらない）。 */
  const catalog = await getCatalog();
  const piece = (folder: string) => catalog.find((p) => p.folder === folder)!;
  const [sakura, ai, wakaba, musubi] = [piece("sakura"), piece("ai"), piece("wakaba"), piece("musubi")];

  const recentNotes = (await getBlogPosts()).slice(0, 3);
  /* ヒーローと Material セクションの導線。slug は焼き込まない（`blogHref` の註を読む）。 */
  const materialHref = await blogHref("the-edge-that-remains", "Materials");

  return (
    <>
      <HomeHero materialHref={materialHref} />

      {/*
        ヒーローの上に上がってくる紙の面。ヒーローは sticky で貼り付いたままなので、
        黒い版が上へ抜けるのではなく、ivory の紙がそれを覆っていく。
        暗 → 明の切り替えを「別のセクションが始まった」ではなく「紙が上がってきた」に見せる。
        上辺の影は紙が部屋に落とす影。ここが罫一本だと、境目がただの切り口に見える。
        z-10 は必須 — 素の（position を持たない）セクションは sticky の下に潜って消える。
      */}
      <div
        data-page-sheet
        className="relative z-10 bg-ivory shadow-[0_-40px_90px_-40px_rgba(15,12,8,0.62)]"
      >

        {/* 2. Intro — text as a page, not a marketing block */}
        <section className="washi-grain relative">
          <div className={`${SHELL} grid gap-12 py-16 md:grid-cols-12 md:gap-8 md:py-24`}>
            <Reveal className="md:col-span-7 lg:col-span-6">
              <p className="eyebrow">Atelier note</p>
              <h2 data-split-lines className="mt-5 font-display text-[clamp(32px,4.2vw,56px)] font-light leading-[1.08] text-ink">
                Objects woven from
                <br />
                a leftover edge.
              </h2>
            </Reveal>
            {/* 段は文章の幅ぶんだけ。38ch で止めると 4 カラムの右側に穴が空く。 */}
            <Reveal delay={120} className="flex flex-col justify-end md:col-span-5 md:col-start-8 lg:col-span-4 lg:col-start-9">
              <p className="font-sans text-[15px] leading-[1.85] text-charcoal/90">
                One-of-a-kind bags, made at a temple in Fuji City, from tatami-beri remnants and paper
                band recycled in the same streets. Each piece is finished by hand, blessed at the temple,
                and never made twice.
              </p>
              <p className="mt-6 font-jp text-[12.5px] leading-[2] tracking-[0.04em] text-mist">
                {phrases.madeOnce.ja}
              </p>
            </Reveal>
          </div>
        </section>

        {/* 3. Featured — chosen, not a row of equal cards */}
        <section>
          <div className={SHELL}>
            <Reveal className="flex items-end justify-between gap-6 border-b border-line pb-5">
              <div>
                <p className="eyebrow">Exhibition · 2026</p>
                <h2 data-split-lines className="mt-3 font-display text-[clamp(32px,3.8vw,48px)] font-light leading-none text-ink">
                  Pieces on show
                </h2>
              </div>
              <Button href="/collection" variant="link" className="mb-1">
                All nine
              </Button>
            </Reveal>

            {/*
              三点とも同じ展示台。序列は大きさではなく hover（触れた一点が前に出る）で付ける。
              スマホでは縦積みにしない — 4:5 の台が三つで 1,400px、そのほとんどが空の床になる。
              PDP のギャラリーと同じ所作で横へ送る（一点ずつ中央に立て、次の端が覗く）。
              中央寄せと 01 / 03 は SwipeStrip が持つ（コマの入れ方の理由はそちらの註）。
            */}
            <SwipeStrip
              className="mt-12"
              trackClassName="-mx-4 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-3 sm:gap-8 sm:overflow-visible md:gap-10"
            >
              {[sakura, ai, wakaba].map((piece, i) => (
                <Reveal key={piece.slug} delay={i * 80}>
                  <FloatingBag product={piece} index={i} priority={i < 2} />
                  <p className="mt-3 max-w-[36ch] font-sans text-[12.5px] leading-[1.75] text-charcoal/75">
                    {piece.note}
                  </p>
                </Reveal>
              ))}
            </SwipeStrip>
          </div>
        </section>

        {/* 4. Material essay */}
        <section className="pt-24 md:pt-32">
          <div className={`${SHELL} grid gap-12 md:grid-cols-12 md:items-start md:gap-8`}>
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
            {/* 中身は 400px の写真と 46ch の本文。6 カラムに置くと右に 200px の穴が残る。 */}
            <div className="md:col-span-6 md:col-start-7 lg:col-span-4 lg:col-start-9">
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
                <Button href={materialHref} variant="link">
                  Read the material note
                </Button>
              </Reveal>
            </div>
          </div>
        </section>

        {/*
          縁が部屋を一周するように、縦に読むと横へ流れる帯。並べるのはバッグの写真だけ。
          bamboo-trio は竹林の引きなので、4:5 に切ると作品が小さく、帯の中で一枚だけ風景に見えた。
          作品の行列にするため、同じ寄りの product カットへ差し替えている。
        */}
        <DriftBand
          shots={[
            { src: productImage("sakura-cherry", 1), alt: "" },
            { src: productImage("matsu-pine", 1), alt: "" },
            { src: productImage("ai-indigo", 1), alt: "" },
            { src: productImage("musubi-obi", 1), alt: "" },
            { src: productImage("wakaba-celadon", 1), alt: "" },
            { src: productImage("hisui-jade", 1), alt: "" },
          ]}
        />

        {/* 5. Campaign / living objects */}
        <section className={`${SHELL} pt-4 md:pt-6`}>
          <Reveal className="md:max-w-[36ch]">
            <p className="eyebrow">In place</p>
            <h2 data-split-lines className="mt-4 font-display text-[clamp(32px,3.6vw,46px)] font-light leading-[1.1] text-ink">
              How a piece fits into a day.
            </h2>
          </Reveal>
          {/*
            A: 横長の一枚と文章を、同じ天から始める。
            B: 縦位置を二枚、同じ高さで左右の端に揃える。
            タブレットでは文章の段を 4 → 5 カラムに広げる。768px の 4 カラムは 215px しかなく、
            30px の見出しが一行三語で折れて、文章に見えなくなる。
          */}
          <div className="mt-12 grid gap-8 md:grid-cols-12 md:gap-10">
            <Reveal className="md:col-span-7 lg:col-span-8">
              <Frame
                src="/images/scenes/kimono-corridor.webp"
                alt="Walking the temple corridor in kimono, a bag at the hip"
                role="lifestyle"
                ratio="16/10"
                caption="Corridor, Honmyoji"
                sizes="(min-width: 1024px) 64vw, (min-width: 768px) 56vw, 100vw"
              />
            </Reveal>
            <Reveal delay={100} className="flex flex-col justify-center md:col-span-5 lg:col-span-4">
              <p className="font-display text-[clamp(24px,2.3vw,30px)] font-light leading-[1.3] text-ink">
                Not styled for a season. Made to be carried — to a tea room, to the market, to the
                front door and back.
              </p>
              <p className="mt-6 font-sans text-[14px] leading-[1.85] text-charcoal/85">
                Every photograph here was taken in the temple grounds — the hall, the bamboo grove,
                the corridor. Nothing was shot in a studio.
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
        <section className="mt-20 bg-parchment/70 md:mt-28">
          <div className={`${SHELL} grid gap-12 py-16 md:grid-cols-12 md:gap-8 md:py-24`}>
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
            <Reveal delay={100} className="flex flex-col justify-center md:col-span-6 md:col-start-7 lg:col-span-5 lg:col-start-8">
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
                  Every finished piece is set down in the hall before it leaves. After that, it
                  belongs to the person who found it.
                </p>
              </div>
              <Button href="/about" variant="outline" className="mt-8 w-fit">
                The maker and the place
              </Button>
            </Reveal>
          </div>
        </section>

        {/* 7. The blog as a publication, not a blog widget */}
        <section className={`${SHELL} py-16 md:py-24`}>
          {/*
            一覧は 1040px で読める幅を保つ。ただし版面が 1384px まで開く xl 以上では
            右に 344px の空白が残るので、そこで見出しを左の段へ出して版面を埋める
            （Material セクションと同じ組み方）。xl 未満は版面が 1184px 以下で
            穴が小さいため、見出し行と一覧を同じ 1040px で上下に積む。
          */}
          <div className="max-w-[1040px] xl:max-w-none xl:grid xl:grid-cols-12 xl:gap-8">
            <Reveal className="flex items-end justify-between gap-6 xl:col-span-3 xl:flex-col xl:items-start xl:justify-start xl:gap-8">
              <div>
                <p className="eyebrow">Blog</p>
                <h2 data-split-lines className="mt-3 font-display text-[clamp(32px,3.8vw,48px)] font-light leading-none text-ink">
                  Recent notes
                </h2>
              </div>
              <Button href="/blog" variant="link" className="mb-1 xl:mb-0">
                The archive
              </Button>
            </Reveal>

            <ol className="mt-12 divide-y divide-line border-y border-line xl:col-span-8 xl:col-start-5 xl:mt-0">
              {recentNotes.map((entry, i) => (
                <Reveal key={entry.slug} as="li" delay={i * 60}>
                  <Link
                    href={`/blog/${entry.slug}`}
                    className="group grid gap-x-8 gap-y-2 py-7 no-underline md:grid-cols-12"
                  >
                    <p className="font-sans text-[10px] uppercase leading-[1.9] tracking-[0.2em] text-mist md:col-span-3">
                      {entry.topic}
                      <span className="block text-mist/75">
                        {blogMeta(entry.season, entry.date.slice(0, 4))}
                      </span>
                    </p>
                    <div className="md:col-span-8">
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
          </div>
        </section>

        {/* quiet closing piece, not a CTA banner */}
        <section className={`${SHELL} pb-8`}>
          <Reveal className="grid gap-8 border-t border-line pt-10 md:grid-cols-12">
            {/* 一文を 7 カラム（800px）に置くと一行で流れて、締めの言葉に見えない。折って、写真と同じ高さの中央に置く。 */}
            <p className="self-center font-display text-[clamp(22px,2.6vw,32px)] font-light leading-[1.35] text-ink md:col-span-6 lg:col-span-5">
              {phrases.noTwo.en}
            </p>
            <div className="md:col-span-4 md:col-start-9">
              <StillTile product={musubi} ratio="1/1" />
            </div>
          </Reveal>
        </section>
      </div>
    </>
  );
}
