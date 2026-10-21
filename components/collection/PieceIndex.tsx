import Link from "next/link";

import { LINE_LABEL, LINE_ORDER, productPath, type Product, type ProductLine } from "@/data/products";

/** リンクに必要な分だけ。物語や値段は渡さない。 */
export type PieceRef = Pick<Product, "slug" | "name" | "line">;

export function toPieceRefs(pieces: readonly Product[]): PieceRef[] {
  return pieces.map((piece) => ({ slug: piece.slug, name: piece.name, line: piece.line }));
}

/**
 * 作品の名前だけを並べたリンク。写真のタイル（`PieceTile`）の代わりに、
 * 索引として置く。枠も影も付けない。
 */
export function PieceNameLinks({
  pieces,
  label,
  className = "",
}: {
  pieces: readonly PieceRef[];
  label?: string;
  className?: string;
}) {
  if (pieces.length === 0) return null;
  return (
    <ul aria-label={label} className={`flex flex-wrap gap-x-4 gap-y-2 ${className}`}>
      {pieces.map((piece) => (
        <li key={piece.slug}>
          <Link href={productPath(piece)} className="link-line font-sans text-small text-bone hover:text-ivory">
            {piece.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** 区分ごとの名前の索引。見出しは一覧の節（`/collection#…`）へ、名前は作品のページへ。 */
export function PieceIndex({ pieces, className = "" }: { pieces: readonly PieceRef[]; className?: string }) {
  const groups = LINE_ORDER.map((line) => ({
    line,
    items: pieces.filter((piece) => piece.line === line),
  })).filter((group) => group.items.length > 0);
  if (groups.length === 0) return null;

  return (
    <div className={`border-t border-line ${className}`}>
      {groups.map(({ line, items }) => (
        <div key={line} className="grid gap-3 border-b border-line py-6 md:grid-cols-12 md:items-baseline md:gap-8">
          <h3 className="font-display text-title font-light text-ivory md:col-span-4">
            <Link href={collectionLine(line)} className="no-underline">
              {LINE_LABEL[line].plural}
            </Link>
          </h3>
          <PieceNameLinks pieces={items} className="md:col-span-8" />
        </div>
      ))}
    </div>
  );
}

function collectionLine(line: ProductLine): string {
  return `/collection#${line}`;
}
