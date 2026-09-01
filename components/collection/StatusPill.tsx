import { STATUS_LABEL, type ProductStatus } from "@/data/products";

const tone: Record<ProductStatus, string> = {
  available: "text-moss",
  reserved: "text-charcoal",
  /* 完売は一覧で読み落とされてはいけない。meta の mist ではなく本文より濃い ink で言い切る。 */
  sold_out: "text-ink",
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
