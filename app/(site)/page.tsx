import Image from "next/image";
import Link from "next/link";
import { DriftBand } from "@/components/site/DriftBand";
import { Button } from "@/components/site/Button";
import { Frame } from "@/components/site/Frame";
import { ChapterRail, type Chapter } from "@/components/site/ChapterRail";
import { Reveal } from "@/components/site/Reveal";
import { SHELL } from "@/components/site/Shell";
import { HomeHero } from "@/components/home/HomeHero";
import { PieceTile } from "@/components/collection/PieceTile";
import { LINE_BLURB, LINE_LABEL, LINE_ORDER, productImage } from "@/data/products";
import { getCatalog } from "@/lib/catalog";
import { blogMeta } from "@/data/blog";
import { blogHref, getBlogPosts } from "@/lib/microcms";
import { founder } from "@/data/site";

/*
  縦のリズム。DESIGN.md は 80–160px、ただし同じ数字の繰り返しにはしない。
  余白は「片側だけ」持たせる — 背景を敷くセクションだけが自分の内側に上下の余白を持ち、
  それ以外は上だけ持つ。

  **見出しの上に小さな大文字のラベルを置かない**（2026-09-25）。以前は七つの節すべてに
  「ATELIER NOTE」「EXHIBITION · 2026」のようなラベルと、字間を空けた和文の一行が
  付いていた。節の番号は左の `ChapterRail` が持っているので、見出しは見出しだけで立つ。
*/

/*
  章。長い一枚を、番号の付いた節として読ませる（`ChapterRail`）。
  一つ目はヒーローで、sticky なので ScrollTrigger では測れない —— レール側は
  「二つ目より上にいるなら一つ目」で決めるので、ここに id は要らない。
  節を足したら必ずここにも足すこと（id が無い章は黙って飛ばされる）。
*/
const CHAPTERS: Chapter[] = [
  { id: "ch-opening", label: "Opening" },
  { id: "ch-pieces", label: "Pieces" },
  { id: "ch-tatami", label: "Tatami" },
  { id: "ch-worn", label: "Worn" },
  { id: "ch-lines", label: "Lines" },
  { id: "ch-making", label: "Making" },
  { id: "ch-blog", label: "Blog" },
];

/** トップに出す四点（folder 名 = クライアントの番号）。色の違う四本を選んである。 */
const FEATURED = ["bottle-07", "bottle-01", "bottle-06", "bottle-13"];
/** 横へ流れる帯。立ち姿の主役（4:5）だけ — 平置きや横長を混ぜると帯の高さが崩れる。 */
const DRIFT = ["bottle-02", "origami-02", "bottle-04", "bottle-09", "origami-01", "bottle-10", "bottle-05b", "origami-03"];
/** 区分の索引に添える一枚。区分の中で、形がいちばんよく分かる主役を選ぶ。 */
const LINE_COVER: Record<(typeof LINE_ORDER)[number], string> = {
  "tatami-beri": "bottle-05",
  origami: "origami-04",
  handbag: "handbag-01",
  kimono: "kimono-04",
  apron: "apron-01",
};

export default async function HomePage() {
  /* カタログ経由で引くので、管理画面で直した価格とステータスがそのまま出る。 */
  const catalog = await getCatalog();
  const featured = FEATURED.map((f) => catalog.find((p) => p.folder === f)).filter((p) => p !== undefined);

  const recentNotes = (await getBlogPosts()).slice(0, 3);
  /* Tatami セクションの導線（素材の記事）。slug は焼き込まない（`blogHref` の註を読む）。 */
  const materialHref = await blogHref("the-edge-that-remains", "Materials");

  return (
    <>
      <ChapterRail chapters={CHAPTERS} />
      <HomeHero count={catalog.length} />

      {/*
        ヒーローの上に上がってくる面。ヒーローは sticky で貼り付いたままなので、
        第一画面が上へ抜けるのではなく、この面がそれを覆っていく。
        覆われた合図は**上辺の罫一本**が全部背負う。黒い面が黒い部屋を覆うのは、線が無いと見えない。
        z-10 は必須 — 素の（position を持たない）セクションは sticky の下に潜って消える。
      */}
      <div data-page-sheet className="relative z-10 border-t border-line bg-sumi">
        {/* 2. Pieces — 同じ床・同じ障子の前に立つ四本 */}
        <section id="ch-pieces" className="pt-16 md:pt-24">
          <div className={SHELL}>
            <Reveal className="flex items-end justify-between gap-6">
              <h2
                data-split-lines
                className="font-display text-[clamp(32px,3.8vw,52px)] font-light leading-none text-ivory"
              >
                New pieces
              </h2>
              <Button href="/collection" variant="link" className="mb-1 shrink-0">
                All {catalog.length}
              </Button>
            </Reveal>

            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 md:mt-14 lg:grid-cols-4 lg:gap-x-8">
              {featured.map((piece, i) => (
                <PieceTile
                  key={piece.slug}
                  product={piece}
                  priority={i < 2}
                  revealDelay={i * 80}
                  sizes="(min-width: 1024px) 24vw, 48vw"
                />
              ))}
            </div>
          </div>
        </section>

        {/*
          3. Tatami — 畳とは何か。海外の人は畳の部屋を知らないことが多く、「畳の縁」と言われても
          それがどこの何なのか分からない。部屋 → 縁 → バッグの順で、一節で分かるようにする
          （2026-09-25、織りの寄りだけを置いていた「The edge of a tatami room」から差し替え）。
          写真二枚は Unsplash（scripts/prepare-photos.py の STOCK）—— 寺の写真ではないので、
          alt でも本文でも本妙寺とは言わない。
        */}
        <section id="ch-tatami" className="pt-28 md:pt-40">
          <div className={SHELL}>
            <div className="grid gap-10 md:grid-cols-12 md:items-end md:gap-8">
              <Reveal className="md:col-span-5">
                <h2
                  data-split-lines
                  className="font-display text-[clamp(34px,4vw,56px)] font-light leading-[1.06] text-ivory"
                >
                  A floor of woven rush, edged in cloth.
                </h2>
                <p className="mt-8 max-w-[44ch] font-sans text-[15.5px] leading-[1.9] text-bone">
                  Tatami are the mats that make the floor of a traditional Japanese room — laid edge to
                  edge, so closely that the room is measured in them: a six-mat room, an eight-mat room.
                  The dark lines you see running across the floor are their edges.
                </p>
              </Reveal>
              <div className="md:col-span-7">
                <Frame
                  src="/images/stock/tatami-room.webp"
                  alt="A large tatami room with shoji screens, the dark edging of each mat drawing lines across the floor"
                  role="lifestyle"
                  ratio="3/2"
                  from="right"
                  sizes="(min-width: 768px) 56vw, 100vw"
                />
              </div>
            </div>

            <div className="mt-16 grid gap-10 md:mt-24 md:grid-cols-12 md:gap-8">
              <div className="md:col-span-5">
                <Frame
                  src="/images/stock/tatami-edge.webp"
                  alt="Low light across a tatami floor, where the woven rush meets its cloth edging"
                  role="material-macro"
                  ratio="4/5"
                  from="left"
                  sizes="(min-width: 768px) 40vw, 100vw"
                />
              </div>
              {/* 三つの言葉を定義の表で。カードを三つ横に並べる（DESIGN.md が捨てた 3-up）にはしない。 */}
              <Reveal delay={80} className="flex flex-col justify-center md:col-span-6 md:col-start-7">
                <dl className="divide-y divide-line border-y border-line">
                  <div className="grid gap-3 py-7 sm:grid-cols-[180px_1fr] sm:gap-8">
                    <dt className="font-display text-[24px] font-light leading-none text-ivory">
                      Tatami
                      <span lang="ja" className="ml-2 font-jp text-[12px] tracking-[0.12em] text-mist">畳</span>
                    </dt>
                    <dd className="max-w-[46ch] font-sans text-[15px] leading-[1.85] text-bone">
                      A mat of woven igusa rush over a thick core, roughly 90 by 180 centimetres. Soft
                      underfoot, it smells of cut grass when new and turns from green to gold as it ages.
                    </dd>
                  </div>
                  <div className="grid gap-3 py-7 sm:grid-cols-[180px_1fr] sm:gap-8">
                    <dt className="font-display text-[24px] font-light leading-none text-ivory">
                      Tatami-beri
                      <span lang="ja" className="ml-2 font-jp text-[12px] tracking-[0.12em] text-mist">畳縁</span>
                    </dt>
                    <dd className="max-w-[46ch] font-sans text-[15px] leading-[1.85] text-bone">
                      The band of woven cloth sewn along the two long sides of each mat. It protects the
                      rush and draws the lines of the room — often plain in a house, brocade with crests and
                      gold thread in a temple hall.
                    </dd>
                  </div>
                  <div className="grid gap-3 py-7 sm:grid-cols-[180px_1fr] sm:gap-8">
                    <dt className="font-display text-[24px] font-light leading-none text-ivory">The bags</dt>
                    <dd className="max-w-[46ch] space-y-4 font-sans text-[15px] leading-[1.85] text-bone">
                      <p>
                        Every time a room is laid, the tatami maker is left with offcuts of edging too short
                        to use. Those remnants are what MIROKU is made from — woven onto paper band recycled
                        in Fuji City.
                      </p>
                      <p>
                        The character <span lang="ja" className="font-jp text-ivory">縁</span> is also read{" "}
                        <em className="font-display text-[17px] not-italic text-ivory">en</em>: a meeting.
                      </p>
                    </dd>
                  </div>
                </dl>
                <Button href={materialHref} variant="link" className="mt-8 w-fit">
                  Read the material note
                </Button>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 縁が部屋を一周するように、縦に読むと横へ流れる帯。並べるのは立ち姿の作品だけ。 */}
        <DriftBand
          shots={DRIFT.map((folder) => ({ src: productImage(folder, 1), alt: "" }))}
        />

        {/* 4. Worn — 着姿 */}
        <section id="ch-worn" className={`${SHELL} pt-4 md:pt-8`}>
          {/*
            A: 横長の一枚と文章を、同じ天から始める。
            B: 着姿の縦位置を三枚、版面の 12 段に 4 段ずつ —— 左右の端と段の罫が全部揃う。
               以前は二枚を左右の端に 5 段ずつ置いて真ん中に 2 段の穴を空けていた。揃ってもいないし、
               意図した空白にも見えなかった（2026-09-25）。どの一枚もバッグが丸ごと写っているものだけ。
               撮ったままの 2:3 に近い比率で置くので、顔も手元のバッグも切れない。
          */}
          <div className="grid gap-8 md:grid-cols-12 md:gap-10">
            <div className="md:col-span-7 lg:col-span-8">
              <Frame
                src="/images/scenes/hall-front.webp"
                alt="Holding the Hishi handbag in the temple hall"
                role="lifestyle"
                ratio="16/10"
                from="left"
                sizes="(min-width: 1024px) 64vw, (min-width: 768px) 56vw, 100vw"
              />
            </div>
            <Reveal delay={100} className="flex flex-col justify-center md:col-span-5 lg:col-span-4">
              <h2
                data-split-lines
                className="font-display text-[clamp(28px,2.8vw,40px)] font-light leading-[1.15] text-ivory"
              >
                Made to be carried, and made to go with kimono.
              </h2>
              <p className="mt-6 max-w-[44ch] font-sans text-[15px] leading-[1.85] text-bone">
                Every photograph of the bags was taken at Honmyoji — the hall, the windows, the wooden
                floor they were made on. None was shot in a studio.
              </p>
              <Button href="/collection" variant="outline" className="mt-8 w-fit">
                The collection
              </Button>
            </Reveal>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-4 md:mt-10 md:grid-cols-12 md:gap-10">
            {[
              {
                src: "/images/scenes/laugh.webp",
                alt: "Laughing, a tall bottle bag of green and sky-blue tatami-beri held at the waist",
                from: "left" as const,
              },
              {
                src: "/images/scenes/red-bottle.webp",
                alt: "A red tatami-beri bottle bag held in both hands against a cream kimono",
                from: "bottom" as const,
              },
              {
                src: "/images/scenes/tote-portrait.webp",
                alt: "At the window with the Kago basket bag in hand",
                from: "right" as const,
              },
            ].map((shot, i) => (
              <div key={shot.src} className="md:col-span-4">
                <Frame
                  src={shot.src}
                  alt={shot.alt}
                  role="lifestyle"
                  ratio="3/4"
                  wellClass="aspect-[2/3]"
                  from={shot.from}
                  revealDelay={i * 110}
                  sizes="(min-width: 768px) 30vw, 33vw"
                />
              </div>
            ))}
          </div>
        </section>

        {/*
          5. Lines — 区分の索引。二十六点を一枚の格子に流す前に、何の店かを五行で言う。
          写真は小さく、左に揃える（行の頭が揃うので、表として読める）。
        */}
        <section id="ch-lines" className={`${SHELL} pt-28 md:pt-40`}>
          <Reveal>
            <h2
              data-split-lines
              className="font-display text-[clamp(32px,3.8vw,52px)] font-light leading-none text-ivory"
            >
              Five kinds of work
            </h2>
          </Reveal>
          <ul className="mt-10 border-t border-line md:mt-14">
            {LINE_ORDER.map((line, i) => {
              const items = catalog.filter((p) => p.line === line);
              if (items.length === 0) return null;
              return (
                <Reveal key={line} as="li" delay={i * 50} className="border-b border-line">
                  <Link
                    href={`/collection#${line}`}
                    className="group grid grid-cols-[88px_1fr_auto] items-center gap-5 py-5 no-underline sm:grid-cols-[132px_1fr_auto] md:grid-cols-[160px_1fr_1fr_auto] md:gap-8"
                  >
                    <span className="relative block aspect-[3/2] overflow-hidden bg-sumi">
                      <Image
                        src={productImage(LINE_COVER[line], 1)}
                        alt=""
                        fill
                        sizes="160px"
                        className="object-cover transition-transform duration-700 ease-[var(--ease-soft)] group-hover:scale-[1.04]"
                      />
                    </span>
                    <span className="font-display text-[clamp(22px,2.4vw,32px)] font-light leading-none text-ivory">
                      {LINE_LABEL[line].plural}
                    </span>
                    <span className="hidden max-w-[48ch] font-sans text-[13.5px] leading-[1.7] text-mist md:block">
                      {LINE_BLURB[line]}
                    </span>
                    <span className="font-sans text-[13px] tabular-nums text-mist transition-colors group-hover:text-ivory">
                      {String(items.length).padStart(2, "0")}
                      <span aria-hidden className="ml-3 inline-block transition-transform duration-500 group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        </section>

        {/*
          6. Making — 縦位置の寄り一枚と文章。写真は左端に着け、文章は写真の高さの中央に置く
          （DESIGN.md: 縦の写真の横に短い文章を置くときは、下に揃えず中央）。
        */}
        <section id="ch-making" className="pt-28 md:pt-40">
          <div className={`${SHELL} grid gap-10 md:grid-cols-12 md:gap-8`}>
            <div className="md:col-span-6 lg:col-span-5">
              <Frame
                src="/images/scenes/altar-close.webp"
                alt="Three bottle bags standing on brocade before the altar of the main hall"
                role="process"
                ratio="4/5"
                from="left"
                crop="object-cover object-[50%_62%]"
                sizes="(min-width: 1024px) 40vw, (min-width: 768px) 48vw, 100vw"
              />
            </div>
            <Reveal delay={100} className="flex flex-col justify-center md:col-span-6 md:col-start-7 lg:col-span-5 lg:col-start-8">
              <h2
                data-split-lines
                className="font-display text-[clamp(28px,3vw,42px)] font-light leading-[1.1] text-ivory"
              >
                Set before the altar, then sent.
              </h2>
              <div className="mt-6 max-w-[44ch] space-y-5 font-sans text-[15px] leading-[1.85] text-bone">
                <p>{founder.handmade.en}</p>
                <p>
                  Every finished piece is set down in the main hall before it leaves. After that, it
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
        <section id="ch-blog" className={`${SHELL} py-28 md:py-40`}>
          {/*
            一覧は 1040px で読める幅を保つ。版面が 1384px まで開く xl 以上では右に 344px の
            空白が残るので、見出しを左の段へ出して版面を埋める（Tatami の節と同じく左に見出しの段）。
          */}
          <div className="max-w-[1040px] xl:grid xl:max-w-none xl:grid-cols-12 xl:gap-8">
            <Reveal className="flex items-end justify-between gap-6 xl:col-span-3 xl:flex-col xl:items-start xl:justify-start xl:gap-8">
              <h2
                data-split-lines
                className="font-display text-[clamp(32px,3.8vw,48px)] font-light leading-none text-ivory"
              >
                Notes
              </h2>
              <Button href="/blog" variant="link" className="mb-1 xl:mb-0">
                The blog
              </Button>
            </Reveal>

            <ol className="mt-12 divide-y divide-line border-y border-line xl:col-span-8 xl:col-start-5 xl:mt-0">
              {recentNotes.map((entry, i) => (
                <Reveal key={entry.slug} as="li" delay={i * 60}>
                  <Link
                    href={`/blog/${entry.slug}`}
                    className="group grid gap-x-8 gap-y-2 py-7 no-underline md:grid-cols-12"
                  >
                    <p className="font-sans text-[12.5px] leading-[1.7] text-mist md:col-span-3">
                      {entry.topic}
                      <span className="block text-mist/75">{blogMeta(entry.season, entry.date.slice(0, 4))}</span>
                    </p>
                    <div className="md:col-span-8">
                      <h3 className="font-display text-[26px] font-light leading-[1.2] text-ivory">{entry.title}</h3>
                      <p className="mt-1.5 max-w-[52ch] font-sans text-[13.5px] leading-[1.75] text-bone/80">
                        {entry.dek}
                      </p>
                    </div>
                    <span
                      aria-hidden
                      className="hidden font-sans text-[15px] text-mist transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5 group-hover:text-ivory md:col-span-1 md:block md:text-right"
                    >
                      →
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </>
  );
}
