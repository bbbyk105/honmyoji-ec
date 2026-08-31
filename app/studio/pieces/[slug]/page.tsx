import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { resetPiece } from "@/app/studio/actions";
import { DbNotice } from "@/components/studio/DbNotice";
import { STUDIO_HEAD, STUDIO_SHELL } from "@/components/studio/shell";
import { getProduct, productCutout, aud, cm, STATUS_LABEL } from "@/data/products";
import { getOverrides } from "@/lib/catalog";
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

  const overrides = await getOverrides();
  const override = overrides.get(base.slug);

  return (
    <div className={STUDIO_SHELL}>
      <div className={STUDIO_HEAD}>
        <Link
          href="/studio/pieces"
          className="font-sans text-[10.5px] font-medium uppercase tracking-[0.22em] text-mist no-underline transition-colors hover:text-ink"
        >
          ← 作品一覧
        </Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="flex items-end gap-5">
            <div className="relative h-[76px] w-[76px] shrink-0 bg-parchment">
              <Image
                src={productCutout(base.folder)}
                alt=""
                fill
                sizes="76px"
                className="object-contain p-2"
              />
            </div>
            <div>
              <h1 className="font-display text-[clamp(30px,4vw,42px)] font-light leading-[1.02] text-ink">
                {base.name}
                <span className="ml-3 font-jp text-[15px] tracking-[0.24em] text-mist">
                  {base.kanji}
                </span>
              </h1>
              <p className="mt-2 font-mono text-[12px] tracking-[0.06em] text-mist">
                {base.sku} · /{base.slug}
              </p>
            </div>
          </div>

          <Link
            href={`/collection/${base.slug}`}
            target="_blank"
            className="font-sans text-[10.5px] font-medium uppercase tracking-[0.22em] text-mist no-underline transition-colors hover:text-ink"
          >
            公開ページを見る ↗
          </Link>
        </div>
      </div>

      {!dbEnabled ? <DbNotice /> : null}

      <div className="grid gap-x-16 gap-y-10 pb-24 pt-10 lg:grid-cols-[1fr_290px]">
        <PieceForm base={base} override={override} disabled={!dbEnabled} />

        <aside className="lg:pt-2">
          <div className="border border-line bg-paper px-5 py-5">
            <p className="eyebrow">コード側の値</p>
            <dl className="mt-4 space-y-2.5 font-sans text-[13px] leading-[1.6]">
              <div className="flex justify-between gap-4">
                <dt className="text-mist">価格</dt>
                <dd className="tabular-nums text-charcoal">{aud.format(base.priceAud)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-mist">ステータス</dt>
                <dd className="text-charcoal">{STATUS_LABEL[base.status].en}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-mist">寸法</dt>
                <dd className="text-right text-charcoal">
                  {cm(base.size.width)} × {cm(base.size.height)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-mist">写真</dt>
                <dd className="text-charcoal">{base.galleryCount} 枚</dd>
              </div>
            </dl>
            <p className="mt-5 border-t border-line pt-4 font-sans text-[12px] leading-[1.8] text-mist">
              寸法と写真は
              <code className="mx-1 font-mono text-[11.5px]">data/products.ts</code>
              にあります。実測や撮影とセットで変わる値なので、この画面には出していません。
            </p>
          </div>

          {override ? (
            <form action={resetPiece} className="mt-6">
              <input type="hidden" name="slug" value={base.slug} />
              <p className="font-sans text-[12.5px] leading-[1.8] text-mist">
                最終更新{" "}
                <time dateTime={override.updated_at} className="tabular-nums">
                  {new Date(override.updated_at).toLocaleString("ja-JP", {
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </p>
              <button
                type="submit"
                className="mt-3 cursor-pointer font-sans text-[10.5px] font-medium uppercase tracking-[0.2em] text-clay underline decoration-clay/40 underline-offset-[6px] transition-colors hover:decoration-clay"
              >
                上書きを取り消してコード側に戻す
              </button>
            </form>
          ) : (
            <p className="mt-6 font-sans text-[12.5px] leading-[1.8] text-mist">
              まだ何も上書きしていません。表示されているのは
              <code className="mx-1 font-mono text-[11.5px]">data/products.ts</code>
              の値です。
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
