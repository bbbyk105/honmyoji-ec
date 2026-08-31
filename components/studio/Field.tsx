import type { ReactNode, SelectHTMLAttributes } from "react";

/**
 * 管理画面の入力欄。公開サイトの Contact フォームと同じ「紙の升目」を使う。
 * 罫線一本だけの欄はどこを触ればいいのか分からない、というのは管理画面でも同じ
 * ——むしろ一日に何度も触る画面のほうが効く。
 */
export const fieldClass =
  "w-full border border-line bg-paper px-4 py-3 font-sans text-[15px] leading-[1.6] text-ink outline-none transition-colors placeholder:text-mist/70 hover:border-sand focus:border-ink focus:ring-1 focus:ring-ink/15 aria-[invalid=true]:border-clay";

export const labelClass =
  "block font-sans text-[11px] font-medium uppercase tracking-[0.16em] text-charcoal";

export const hintClass = "mt-2 font-sans text-[12px] leading-[1.6] text-mist";

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {hint ? <p className={hintClass}>{hint}</p> : null}
    </div>
  );
}

/** `appearance-none` の select は矢印が消えるので、自前で置く（DESIGN.md）。 */
export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={`${fieldClass} cursor-pointer appearance-none pr-11 ${className}`}>
        {children}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-sans text-[11px] text-mist"
      >
        ▾
      </span>
    </div>
  );
}

/**
 * 保存の結果。エラーは clay（moss は「購入可能」の色なので失敗に使わない）。
 * 成功は帯を出さず、点と時刻だけ —— 毎回大きく出ると、次の作業の邪魔になる。
 */
export function Notice({ error, saved }: { error?: string; saved?: string }) {
  if (error) {
    return (
      <p
        role="alert"
        className="border border-clay/60 bg-paper px-4 py-3 font-sans text-[13px] leading-[1.7] text-clay"
      >
        {error}
      </p>
    );
  }
  if (saved) {
    return (
      <p className="flex items-center gap-2.5 font-sans text-[12px] text-mist">
        <span aria-hidden className="h-1.5 w-1.5 bg-moss" />
        保存しました
        <time dateTime={saved} className="tabular-nums">
          {new Date(saved).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
        </time>
      </p>
    );
  }
  return null;
}
