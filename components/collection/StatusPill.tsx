import { STATUS_LABEL, type ProductStatus } from "@/data/products";

const tone: Record<ProductStatus, string> = {
  available: "text-moss",
  reserved: "text-charcoal",
  sold_out: "text-mist",
  coming_soon: "text-indigo",
};

export function StatusPill({ status, className = "" }: { status: ProductStatus; className?: string }) {
  return (
    <span className={`font-sans text-[9px] font-medium uppercase tracking-[0.24em] ${tone[status]} ${className}`}>
      {STATUS_LABEL[status].en}
      {status === "available" ? <span className="text-mist"> · one of a kind</span> : null}
    </span>
  );
}
