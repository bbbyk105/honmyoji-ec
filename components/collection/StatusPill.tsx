import { STATUS_LABEL, type ProductStatus } from "@/data/products";

const tone: Record<ProductStatus, string> = {
  available: "text-moss",
  reserved: "text-bone",
  /*
    完売はいちばん静かな段。地が純黒になって ivory が純白になったので、この一語が
    ページで一番明るいものになり、「買える」より「売り切れ」のほうが目立っていた（2026-09-20）。
    読み落とされない役目は、写真の中央に罫を引く `SoldBand` が既に負っている —— 二度言わない。
  */
  sold_out: "text-mist",
  coming_soon: "text-indigo",
  /* clay は素材の色。受注生産は「縁を選んで織り直す」なので、材料の側の色で言う。 */
  made_to_order: "text-clay",
};

/**
 * 状態の一語。**大文字・字間の広い 9px にしない**（2026-09-25）。どの見出しの上にも
 * 小さな大文字のラベルが乗っているのが「テンプレートで組んだ」に見える一番の理由だったので、
 * 状態は文と同じ書き方（先頭だけ大文字）で、色だけで区別する。
 */
export function StatusPill({ status, className = "" }: { status: ProductStatus; className?: string }) {
  return (
    <span className={`font-sans text-meta ${tone[status]} ${className}`}>
      {STATUS_LABEL[status].en}
    </span>
  );
}
