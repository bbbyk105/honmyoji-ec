import Image from "next/image";
import Link from "next/link";

import { DbNotice } from "@/components/studio/DbNotice";
import { PieceStatusSelect } from "@/components/studio/PieceStatusSelect";
import { STUDIO_HEAD, STUDIO_SHELL } from "@/components/studio/shell";
import { aud, productCutout } from "@/data/products";
import { getCatalog, getOverrides } from "@/lib/catalog";
import { requireSession } from "@/lib/studio-session";
import { dbEnabled } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * 作品一覧。管理画面の主画面。
 *
 * カードは使わない —— 十点を見比べる画面で、一点ずつ枠に入れると視線が枠を
 * なぞることに使われる。罫線だけの表にして、目が縦に落ちるようにする。
 */
export default async function StudioPiecesPage() {
  await requireSession();

  const [catalog, overrides] = await Promise.all([getCatalog(), getOverrides()]);
  const edited = catalog.filter((p) => overrides.has(p.slug)).length;

  return (
    <div className={STUDIO_SHELL}>
      <div className={STUDIO_HEAD}>
        <p className="eyebrow">Pieces</p>
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
          <h1 className="font-display text-[clamp(32px,4.4vw,46px)] font-light leading-[1.05] text-ink">
            作品
          </h1>
          <p className="font-sans text-[12.5px] text-mist">
            全 {catalog.length} 点
            {edited > 0 ? ` — うち ${edited} 点をこの画面で上書き中` : ""}
          </p>
        </div>
      </div>

      {!dbEnabled ? <DbNotice /> : null}

      <div className="pb-24">
        <div className="hidden grid-cols-[52px_1fr_120px_100px_200px_64px] items-end gap-5 border-b border-line pb-3 pt-9 md:grid">
          <span />
          <span className="eyebrow">Piece</span>
          <span className="eyebrow">SKU</span>
          <span className="eyebrow text-right">Price</span>
          <span className="eyebrow">Status</span>
          <span />
        </div>

        <ul className="border-b border-line md:border-b-0">
          {catalog.map((piece) => {
            const override = overrides.get(piece.slug);
            return (
              <li
                key={piece.slug}
                className="grid grid-cols-[52px_1fr] items-center gap-x-5 gap-y-3 border-t border-line py-4 transition-colors hover:bg-paper md:grid-cols-[52px_1fr_120px_100px_200px_64px] md:gap-y-0"
              >
                <div className="relative h-13 w-13 bg-parchment">
                  <Image
                    src={productCutout(piece.folder)}
                    alt=""
                    fill
                    sizes="52px"
                    className="object-contain p-1.5"
                  />
                </div>

                <div className="min-w-0">
                  <Link
                    href={`/studio/pieces/${piece.slug}`}
                    className="font-display text-[21px] font-light leading-none text-ink no-underline hover:text-charcoal"
                  >
                    {piece.name}
                    <span className="ml-2.5 font-jp text-[12px] tracking-[0.24em] text-mist">
                      {piece.kanji}
                    </span>
                  </Link>
                  {/* slug だけだと 1fr の列に穴が空く。一言を添えて、どの作品か
                      写真を見なくても分かるようにする。 */}
                  <p className="mt-1.5 truncate font-sans text-[12px] text-mist">
                    /{piece.slug}
                    <span className="text-mist/70"> — {piece.note}</span>
                  </p>
                </div>

                <p className="col-start-2 font-mono text-[12px] tracking-[0.06em] text-mist md:col-start-auto">
                  {piece.sku}
                </p>

                <p className="col-start-2 font-sans text-[15px] tabular-nums text-ink md:col-start-auto md:text-right">
                  {aud.format(piece.priceAud)}
                  {override?.price_aud ? (
                    <span
                      aria-hidden
                      title="この画面で上書きした価格"
                      className="ml-1.5 inline-block h-1 w-1 -translate-y-0.75 bg-clay"
                    />
                  ) : null}
                </p>

                <div className="col-start-2 md:col-start-auto">
                  <PieceStatusSelect
                    slug={piece.slug}
                    status={piece.status}
                    disabled={!dbEnabled}
                  />
                </div>

                <Link
                  href={`/studio/pieces/${piece.slug}`}
                  className="col-start-2 font-sans text-[10.5px] font-medium uppercase tracking-[0.2em] text-mist no-underline transition-colors hover:text-ink md:col-start-auto md:text-right"
                >
                  編集
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 max-w-[44em] font-sans text-[12.5px] leading-[1.9] text-mist">
          写真の枚数・カットアウトの比率・寸法は
          <code className="mx-1 font-mono text-[12px]">data/products.ts</code>
          に残してあります。写真を差し替えないと変えられない値なので、この画面からは触れません。
        </p>
      </div>
    </div>
  );
}
