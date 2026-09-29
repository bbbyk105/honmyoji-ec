import { DbNotice } from "@/components/studio/DbNotice";
import { PieceTable, type PieceGroup } from "@/components/studio/PieceTable";
import { STUDIO_SHELL } from "@/components/studio/shell";
import { Kpi, StudioHead } from "@/components/studio/StudioHead";
import { LINE_LABEL, LINE_ORDER, leadSrc, priceLabel, type Product } from "@/data/products";
import { getCatalog, getOverrides } from "@/lib/catalog";
import { requireSession } from "@/lib/studio-session";
import { dbEnabled } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const SIZE_JA = { Small: "小", Medium: "中", Large: "大" } as const;

function kind(piece: Product): string {
  const line = LINE_LABEL[piece.line].ja;
  return piece.bottleSize ? `${line}・${SIZE_JA[piece.bottleSize]}` : line;
}

/**
 * 作品・在庫。管理画面の主画面。
 *
 * 区分ごとに一枚の台紙へ並べ、チェックを入れた作品をまとめて切り替える（「販売予定」で
 * 絞って全部選び「購入可能」へ、が売り出しの日の一手になる）。一点だけなら行の右の欄から。
 * 表の本体は client（`PieceTable`）。行のデータはここで組み、カタログ本体を client に渡さない。
 */
export default async function StudioPiecesPage() {
  await requireSession();

  const [catalog, overrides] = await Promise.all([getCatalog(), getOverrides()]);

  const groups: PieceGroup[] = LINE_ORDER.map((line) => ({
    key: line,
    label: LINE_LABEL[line].ja,
    rows: catalog
      .filter((p) => p.line === line)
      .map((p) => ({
        slug: p.slug,
        name: p.name,
        kanji: p.kanji,
        sku: p.sku,
        kind: kind(p),
        thumb: leadSrc(p.folder),
        price: priceLabel(p),
        priceOverridden: Boolean(overrides.get(p.slug)?.price_aud),
        status: p.status,
      })),
  })).filter((g) => g.rows.length > 0);

  const count = (status: Product["status"]) => catalog.filter((p) => p.status === status).length;
  const unpriced = catalog.filter((p) => p.priceAud == null).length;

  return (
    <div className={`${STUDIO_SHELL} pb-24`}>
      <StudioHead
        title="作品・在庫"
        lead={
          <>
            チェックを入れた作品の状態を、上の帯からまとめて変えられます。一点だけなら行の右の欄から。
            変えた状態は公開中のサイトにすぐ出ます。価格と文言は「編集」から。
          </>
        }
        kpis={
          <>
            <Kpi label="購入可能" value={count("available")} suffix={`/ ${catalog.length} 点`} />
            <Kpi label="販売予定" value={count("coming_soon")} suffix="点" />
            <Kpi label="完売" value={count("sold_out")} suffix="点" />
            <Kpi label="価格未定" value={unpriced} suffix="点" tone={unpriced > 0 ? "alert" : undefined} />
          </>
        }
      />

      {!dbEnabled ? <DbNotice /> : null}

      <PieceTable groups={groups} disabled={!dbEnabled} />

      <p className="mt-10 max-w-[46em] font-sans text-[13px] leading-[1.9] text-mist">
        写真の枚数・寸法・SKU は
        <code className="mx-1 font-mono text-[12.5px]">data/products.ts</code>
        にあります。写真の差し替えや実測とセットでしか変わらない値なので、この画面からは触れません。
      </p>
    </div>
  );
}
