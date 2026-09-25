import type { Metadata } from "next";
import { PieceTile } from "@/components/collection/PieceTile";
import { Reveal } from "@/components/site/Reveal";
import { SHELL } from "@/components/site/Shell";
import { LINE_BLURB, LINE_LABEL, LINE_ORDER, LINE_RATIO } from "@/data/products";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Collection",
  description:
    "One-of-a-kind bottle bags, origami bags, handbags, kimono shoulder bags and aprons, handmade from tatami-beri and vintage kimono cloth at Honmyoji Temple, Fuji.",
};

/*
  立つ作品（4:5）は細かく、横に広い作品（3:2）は大きく並べる。同じ列数で並べると、
  横長の写真では作品が小さくなりすぎ、縦長では一行が間延びする。
*/
const GRID: Record<"4/5" | "3/2", string> = {
  "4/5": "grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 md:grid-cols-3 md:gap-x-8 md:gap-y-16 xl:grid-cols-4",
  "3/2": "grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 md:gap-x-8 md:gap-y-16",
};

export default async function CollectionPage() {
  const pieces = await getCatalog();
  const groups = LINE_ORDER.map((line) => ({
    line,
    items: pieces.filter((p) => p.line === line),
  })).filter((g) => g.items.length > 0);

  return (
    <section className="pt-16 sm:pt-[72px] md:pt-[80px]">
      <div className={`${SHELL} pb-24 pt-12 sm:pt-14 md:pt-20`}>
        <header className="grid gap-8 md:grid-cols-12 md:items-end">
          <h1 className="font-display text-[clamp(44px,8vw,104px)] font-light leading-[0.92] text-ivory md:col-span-7">
            Collection
          </h1>
          <p className="max-w-[44ch] font-sans text-[15px] leading-[1.85] text-bone md:col-span-5 md:col-start-8 md:pb-2">
            {pieces.length} pieces, each made once. Prices are in Australian dollars with shipping
            included, and are added as each piece is released.
          </p>
        </header>

        {/*
          区分の索引。絞り込みのボタンではなく、下の節への目次 —— 二十六点を一枚の格子に
          流すと、ボトルバッグの列の途中にエプロンが混ざって何の一覧か分からなくなる。
        */}
        <nav aria-label="Lines" className="mt-12 border-y border-line md:mt-16">
          <ul className="-mx-4 flex overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
            {groups.map(({ line, items }) => (
              <li key={line} className="shrink-0">
                <a
                  href={`#${line}`}
                  className="flex min-h-12 items-baseline gap-2 pr-7 font-sans text-[14px] text-bone no-underline transition-colors hover:text-ivory md:pr-10"
                >
                  {LINE_LABEL[line].plural}
                  <span className="text-[12px] tabular-nums text-mist">{items.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {groups.map(({ line, items }) => {
          const ratio = LINE_RATIO[line];
          return (
            <section key={line} id={line} className="scroll-mt-28 pt-16 md:pt-24">
              <Reveal className="grid gap-4 md:grid-cols-12 md:items-baseline">
                <h2
                  data-split-lines
                  className="font-display text-[clamp(30px,3.4vw,44px)] font-light leading-none text-ivory md:col-span-5"
                >
                  {LINE_LABEL[line].plural}
                </h2>
                <p className="max-w-[52ch] font-sans text-[14px] leading-[1.8] text-mist md:col-span-6 md:col-start-7">
                  {LINE_BLURB[line]}
                </p>
              </Reveal>

              <div className={`mt-10 grid md:mt-12 ${GRID[ratio]}`}>
                {items.map((p, i) => (
                  <PieceTile
                    key={p.slug}
                    product={p}
                    priority={line === groups[0].line && i < 4}
                    revealDelay={(i % 4) * 70}
                    sizes={
                      ratio === "4/5"
                        ? "(min-width: 1280px) 24vw, (min-width: 768px) 32vw, 48vw"
                        : "(min-width: 640px) 48vw, 100vw"
                    }
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
