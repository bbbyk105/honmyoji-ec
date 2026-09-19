import { STATUS_LABEL, type ProductStatus } from "@/data/products";

const tone: Record<ProductStatus, string> = {
  available: "text-moss",
  reserved: "text-bone",
  /*
    完売はいちばん静かな段。地が純黒になって ivory が純白になったので、この一語が
    ページで一番明るいものになり、「買える」より「売り切れ」のほうが目立っていた（2026-09-20）。
    読み落とされない役目は、像の中央に罫を引く `SoldBand` が既に負っている —— 二度言わない。
  */
  sold_out: "text-mist",
  coming_soon: "text-indigo",
  /* clay は素材の色。受注生産は「縁を選んで織り直す」なので、材料の側の色で言う。 */
  made_to_order: "text-clay",
};

/** ラベルだけでは足りないぶんを一言。買える二つの状態にだけ付く。 */
const suffix: Partial<Record<ProductStatus, string>> = {
  available: "one of a kind",
  made_to_order: "in your colours",
};

export function StatusPill({ status, className = "" }: { status: ProductStatus; className?: string }) {
  return (
    <span className={`font-sans text-[9px] font-medium uppercase tracking-[0.24em] ${tone[status]} ${className}`}>
      {STATUS_LABEL[status].en}
      {suffix[status] ? <span className="text-mist"> · {suffix[status]}</span> : null}
    </span>
  );
}
