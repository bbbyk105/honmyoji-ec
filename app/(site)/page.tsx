import Image from "next/image";
import Link from "next/link";
import { Arrow } from "@/components/site/Arrow";
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
  縦のリズム。余白は三段（`beat` / `breath` / `pause`、app/globals.css）だけで、
  同じ数字を続けない。面（墨 ⇄ 紙）を持つ節は地を自分で塗るので、上下の余白も自分の内側に持つ。

  面の割り当て（2026-09-25）。**写真の光で決める** —— 堂内の蝋燭と金の光で撮った写真（ヒーロー・
  畳の部屋・祭壇）は墨の上、窓の昼光で撮った作品と着姿、それに読むもの（記事の一覧）は紙の上。
    墨  Opening（ヒーロー）
    紙  Pieces
    墨  Tatami
        — 流れる帯が墨と紙の境目にまたがる（縞にしない）
    紙  Worn → Lines（二節続けて紙）
    墨  Making
    紙  Notes
    墨  フッター

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
      <HomeHero />

      {/*
        ヒーローの上に上がってくる版。ヒーローは sticky で貼り付いたままなので、第一画面が
        上へ抜けるのではなく、この版がそれを覆っていく。最初の節が紙なので、覆われる合図は
        紙の縁そのもの（以前は墨が墨を覆っていたので、上辺に罫を一本引いていた）。
        z-10 は必須 — 素の（position を持たない）セクションは sticky の下に潜って消える。
      */}
      <div data-page-sheet className="relative z-10 bg-sumi">
        {/* 2. Pieces — 同じ床・同じ障子の前に立つ四本。紙の上に置くと、障子の白が地に溶けて作品だけが立つ */}
        <section id="ch-pieces" className="surface-paper pb-pause pt-beat">
          <div className={SHELL}>
            <Reveal className="flex items-end justify-between gap-6">
              <h2 data-split-lines className="font-display text-section font-light text-ivory">
                New pieces
              </h2>
              <Button href="/collection" className="shrink-0">
                All {catalog.length}
              </Button>
            </Reveal>

            <div className="mt-lead grid grid-cols-2 gap-x-4 gap-y-14 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
              {featured.map((piece, i) => (
                <PieceTile
                  key={piece.slug}
                  product={piece}
                  priority={i < 2}
                  revealDelay={i * 90}
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
          alt でも本文でも本妙寺とは言わない。暗い部屋の写真なので墨の面。
        */}
        <section id="ch-tatami" className="pb-pause pt-pause">
          <div className={SHELL}>
            <div className="grid gap-12 md:grid-cols-12 md:items-end md:gap-8">
              <Reveal className="md:col-span-5">
                <h2 data-split-lines className="font-display text-section font-light text-ivory">
                  A floor of woven rush, edged in cloth.
                </h2>
                <p className="mt-8 max-w-[40ch] font-sans text-body text-bone">
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

            <div className="mt-beat grid gap-12 md:grid-cols-12 md:gap-8">
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
              {/*
                三つの言葉を定義の表で。カードを三つ横に並べる（DESIGN.md が捨てた 3-up）にはしない。
                表は置いてあるだけ —— 見出しの行が起きるところで動きは足りている。
              */}
              <div className="flex flex-col justify-center md:col-span-6 md:col-start-7">
                <dl className="divide-y divide-line border-y border-line">
                  <div className="grid gap-3 py-8 sm:grid-cols-[190px_1fr] sm:gap-8">
                    <dt className="font-display text-title font-light text-ivory">
                      Tatami
                      <span lang="ja" className="ml-2.5 font-jp text-[13px] tracking-[0.04em] text-mist">畳</span>
                    </dt>
                    <dd className="max-w-[44ch] font-sans text-small text-bone">
                      A mat of woven igusa rush over a thick core, roughly 90 by 180 centimetres. Soft
                      underfoot, it smells of cut grass when new and turns from green to gold as it ages.
                    </dd>
                  </div>
                  <div className="grid gap-3 py-8 sm:grid-cols-[190px_1fr] sm:gap-8">
                    <dt className="font-display text-title font-light text-ivory">
                      Tatami-beri
                      <span lang="ja" className="ml-2.5 font-jp text-[13px] tracking-[0.04em] text-mist">畳縁</span>
                    </dt>
                    <dd className="max-w-[44ch] font-sans text-small text-bone">
                      The band of woven cloth sewn along the two long sides of each mat. It protects the
                      rush and draws the lines of the room — often plain in a house, brocade with crests and
                      gold thread in a temple hall.
                    </dd>
                  </div>
                  <div className="grid gap-3 py-8 sm:grid-cols-[190px_1fr] sm:gap-8">
                    <dt className="font-display text-title font-light text-ivory">The bags</dt>
                    <dd className="max-w-[44ch] space-y-4 font-sans text-small text-bone">
                      <p>
                        Every time a room is laid, the tatami maker is left with offcuts of edging too short
                        to use. Those remnants are what MIROKU is made from — woven onto paper band recycled
                        in Fuji City.
                      </p>
                      <p>
                        The character <span lang="ja" className="font-jp text-ivory">縁</span> is also read{" "}
                        <em className="font-display text-[1.15em] font-light not-italic text-ivory">en</em>: a meeting.
                      </p>
                    </dd>
                  </div>
                </dl>
                <Button href={materialHref} className="mt-10 w-fit">
                  Read the material note
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/*
          縁が部屋を一周するように、縦に読むと横へ流れる帯。並べるのは立ち姿の作品だけ。
          墨の Tatami と紙の Worn の境目にまたがる —— 上半分が墨、下半分が紙。
        */}
        <DriftBand bridge shots={DRIFT.map((folder) => ({ src: productImage(folder, 1), alt: "" }))} />

        {/* 4–5. Worn と Lines は続けて紙。窓の光で撮った着姿と、区分の索引 */}
        <div className="surface-paper">
          <section id="ch-worn" className={`${SHELL} pt-breath`}>
            {/*
              A: 横長の一枚と文章を、同じ天から始める。
              B: 着姿の縦位置を三枚、版面の 12 段に 4 段ずつ —— 左右の端と段の罫が全部揃う。
                 以前は二枚を左右の端に 5 段ずつ置いて真ん中に 2 段の穴を空けていた。揃ってもいないし、
                 意図した空白にも見えなかった（2026-09-25）。どの一枚もバッグが丸ごと写っているものだけ。
                 撮ったままの 2:3 に近い比率で置くので、顔も手元のバッグも切れない。
            */}
            <div className="grid gap-10 md:grid-cols-12 md:gap-8">
              <div className="md:col-span-7">
                <Frame
                  src="/images/scenes/hall-front.webp"
                  alt="Holding the Hishi handbag in the temple hall"
                  role="lifestyle"
                  ratio="16/10"
                  from="left"
                  sizes="(min-width: 768px) 56vw, 100vw"
                />
              </div>
              <Reveal delay={100} className="flex flex-col justify-center md:col-span-5 lg:col-span-4 lg:col-start-9">
                <h2 data-split-lines className="font-display text-section font-light text-ivory">
                  Made to be carried, and made to go with kimono.
                </h2>
                <p className="mt-8 max-w-[38ch] font-sans text-body text-bone">
                  Every photograph of the bags was taken at Honmyoji — the hall, the windows, the wooden
                  floor they were made on. None was shot in a studio.
                </p>
                <Button href="/collection" className="mt-9 w-fit">
                  The collection
                </Button>
              </Reveal>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-2 sm:gap-4 md:mt-24 md:grid-cols-12 md:gap-8">
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
                    revealDelay={i * 120}
                    sizes="(min-width: 768px) 30vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </section>

          {/*
            5. Lines — 区分の索引。二十六点を一枚の格子に流す前に、何の店かを五行で言う。
            写真は小さく、左に揃える（行の頭が揃うので、表として読める）。表は動かさない。
          */}
          <section id="ch-lines" className={`${SHELL} pb-pause pt-pause`}>
            <Reveal>
              <h2 data-split-lines className="font-display text-section font-light text-ivory">
                Five kinds of work
              </h2>
            </Reveal>
            <ul className="mt-lead border-t border-line">
              {LINE_ORDER.map((line) => {
                const items = catalog.filter((p) => p.line === line);
                if (items.length === 0) return null;
                return (
                  <li key={line} className="border-b border-line">
                    <Link
                      href={`/collection#${line}`}
                      className="group grid grid-cols-[88px_1fr_auto] items-center gap-5 py-6 no-underline sm:grid-cols-[132px_1fr_auto] md:grid-cols-[168px_1fr_1fr_auto] md:gap-10"
                    >
                      <span className="relative block aspect-[3/2] overflow-hidden bg-sumi">
                        <Image
                          src={productImage(LINE_COVER[line], 1)}
                          alt=""
                          fill
                          sizes="168px"
                          className="object-cover transition-transform duration-[1100ms] ease-[var(--ease-soft)] group-hover:scale-[1.02]"
                        />
                      </span>
                      <span className="font-display text-title font-light text-ivory">
                        {LINE_LABEL[line].plural}
                      </span>
                      <span className="hidden max-w-[46ch] font-sans text-small text-mist md:block">
                        {LINE_BLURB[line]}
                      </span>
                      <span className="flex items-center gap-5 font-sans text-meta tabular-nums text-mist transition-colors duration-500 group-hover:text-ivory">
                        {String(items.length).padStart(2, "0")}
                        <Arrow className="cta-arrow" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/*
          6. Making — 縦位置の寄り一枚と文章。祭壇の蝋燭の光なので墨の面。写真は左端に着け、
          文章は写真の高さの中央に置く（DESIGN.md: 縦の写真の横に短い文章を置くときは、下に揃えず中央）。
        */}
        <section id="ch-making" className="py-pause">
          <div className={`${SHELL} grid gap-12 md:grid-cols-12 md:gap-8`}>
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
              <h2 data-split-lines className="font-display text-section font-light text-ivory">
                Set before the altar, then sent.
              </h2>
              <div className="mt-8 max-w-[42ch] space-y-5 font-sans text-body text-bone">
                <p>{founder.handmade.en}</p>
                <p>
                  Every finished piece is set down in the main hall before it leaves. After that, it
                  belongs to the person who found it.
                </p>
              </div>
              <Button href="/about" className="mt-9 w-fit">
                The maker and the place
              </Button>
            </Reveal>
          </div>
        </section>

        {/* 7. The blog as a publication, not a blog widget。読むものなので紙の面 */}
        <section id="ch-blog" className="surface-paper">
          {/*
            一覧は 1040px で読める幅を保つ。版面が 1384px まで開く xl 以上では右に 344px の
            空白が残るので、見出しを左の段へ出して版面を埋める（Tatami の節と同じく左に見出しの段）。
          */}
          <div className={`${SHELL} py-breath`}>
            <div className="max-w-[1040px] xl:grid xl:max-w-none xl:grid-cols-12 xl:gap-8">
              <Reveal className="flex items-end justify-between gap-6 xl:col-span-3 xl:flex-col xl:items-start xl:justify-start xl:gap-10">
                <h2 data-split-lines className="font-display text-section font-light text-ivory">
                  Notes
                </h2>
                <Button href="/blog">The blog</Button>
              </Reveal>

              <ol className="mt-lead divide-y divide-line border-y border-line xl:col-span-8 xl:col-start-5 xl:mt-0">
                {recentNotes.map((entry) => (
                  <li key={entry.slug}>
                    <Link
                      href={`/blog/${entry.slug}`}
                      className="group grid gap-x-8 gap-y-2 py-8 no-underline md:grid-cols-12"
                    >
                      <p className="font-sans text-meta text-mist md:col-span-3">
                        {entry.topic}
                        <span className="block">{blogMeta(entry.season, entry.date.slice(0, 4))}</span>
                      </p>
                      <div className="md:col-span-8">
                        <h3 className="font-display text-title font-light text-ivory">{entry.title}</h3>
                        <p className="mt-2.5 max-w-[52ch] font-sans text-small text-bone">{entry.dek}</p>
                      </div>
                      <span className="hidden justify-end pt-3 text-mist transition-colors duration-500 group-hover:text-ivory md:col-span-1 md:flex">
                        <Arrow className="cta-arrow" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
