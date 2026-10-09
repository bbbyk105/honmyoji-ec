import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { resetPiece } from "@/app/studio/actions";
import { DbDownNotice, DbNotice } from "@/components/studio/DbNotice";
import { BTN_QUIET, LINK_QUIET, STUDIO_CARD, STUDIO_SHELL } from "@/components/studio/shell";
import { PieceBadge } from "@/components/studio/StatusBadge";
import { StudioHead } from "@/components/studio/StudioHead";
import { cm, getProduct, leadSrc, LINE_LABEL, priceLabel } from "@/data/products";
import { PIECE_STATUS_NAME } from "@/app/studio/options";
import { getStudioCatalog } from "@/lib/catalog";
import { requireSession } from "@/lib/studio-session";
import { dbEnabled } from "@/lib/supabase";
import { PieceForm } from "./PieceForm";

export const dynamic = "force-dynamic";

export default async function StudioPiecePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireSession();

  const { slug } = await params;
  const base = getProduct(slug);
  if (!base) notFound();

  // DB を必ず読む（縮退した値で編集させない）。読めなければ帯を出して編集を止める
  const studio = await getStudioCatalog().catch((error: unknown) => {
    console.error("[studio] piece_overrides を読めませんでした", error);
    return null;
  });
  const dbDown = studio === null;
  const override = studio?.overrides.get(base.slug);
  const live = studio?.catalog.find((p) => p.slug === base.slug) ?? base;

  return (
    <div className={`${STUDIO_SHELL} pb-24`}>
      <StudioHead
        back={{ href: "/studio/pieces", label: "作品・在庫" }}
        title={
          <span className="flex items-center gap-5">
            <span className="relative block h-18 w-18 shrink-0 overflow-hidden bg-field">
              <Image src={leadSrc(base.folder)} alt="" fill sizes="72px" className="object-cover" />
            </span>
            <span>
              {base.name}
              <span className="ml-3 font-jp text-[16px] font-normal text-mist">{base.kanji}</span>
            </span>
          </span>
        }
        sub={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <PieceBadge status={live.status} />
            <span className="tabular-nums text-ivory">{priceLabel(live) ?? "価格未定"}</span>
            <span aria-hidden className="text-line">
              ｜
            </span>
            <span>{LINE_LABEL[base.line].ja}</span>
            <span className="font-mono text-[12.5px]">{base.sku}</span>
          </span>
        }
        action={
          <Link href={`/collection/${base.slug}`} target="_blank" className={LINK_QUIET}>
            公開ページを見る ↗
          </Link>
        }
      />

      {!dbEnabled ? <DbNotice /> : dbDown ? <DbDownNotice /> : null}

      <div className="grid gap-x-10 gap-y-10 lg:grid-cols-[1fr_300px]">
        <div className={`${STUDIO_CARD} px-5 py-6 md:px-8 md:py-8`}>
          <PieceForm base={base} override={override} disabled={!dbEnabled || dbDown} />
        </div>

        <aside>
          <div className={`${STUDIO_CARD} px-5 py-5`}>
            <p className="font-sans text-[14px] font-semibold text-ivory">コード側の値</p>
            <p className="mt-1 font-sans text-[12.5px] leading-[1.7] text-mist">
              欄を空にして保存すると、この値に戻ります。
            </p>
            <dl className="mt-4 space-y-2.5 font-sans text-[13.5px] leading-[1.6]">
              <div className="flex justify-between gap-4">
                <dt className="text-mist">価格</dt>
                <dd className="tabular-nums text-ivory">{priceLabel(base) ?? "未定"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-mist">ステータス</dt>
                <dd className="text-ivory">{PIECE_STATUS_NAME[base.status]}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-mist">寸法</dt>
                <dd className="text-right text-ivory">
                  {base.size ? `${cm(base.size.width)} × ${cm(base.size.height)}` : "未計測"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-mist">写真</dt>
                <dd className="text-ivory">{base.galleryCount} 枚</dd>
              </div>
            </dl>
            <p className="mt-5 border-t border-line pt-4 font-sans text-[12.5px] leading-[1.8] text-mist">
              寸法と写真は
              <code className="mx-1 font-mono text-[12px]">data/products.ts</code>
              にあります。実測や撮影とセットで変わる値なので、この画面からは触れません。
            </p>
          </div>

          {override ? (
            <form action={resetPiece} className="mt-6 px-1">
              <input type="hidden" name="slug" value={base.slug} />
              <p className="font-sans text-[13px] leading-[1.8] text-mist">
                この画面で上書き中 — 最終更新{" "}
                <time dateTime={override.updated_at} className="tabular-nums">
                  {new Date(override.updated_at).toLocaleString("ja-JP", {
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </p>
              <button type="submit" className={`mt-2 ${BTN_QUIET} text-clay`}>
                上書きをすべて取り消してコード側に戻す
              </button>
            </form>
          ) : (
            <p className="mt-6 px-1 font-sans text-[13px] leading-[1.8] text-mist">
              まだ何も上書きしていません。表示されているのは
              <code className="mx-1 font-mono text-[12px]">data/products.ts</code>
              の値です。
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
