import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export type ButtonVariant = "solid" | "outline" | "outline-light" | "link" | "link-light";

/**
 * サイト共通のボタン。
 *
 *  solid          その画面で一番やってほしいこと（カートに入れる・送る）
 *  outline        次点（別の作品を見る・問い合わせる）
 *  outline-light  写真の上
 *  link / -light  文中・見出し脇の導線。罫は「常に」引く — hover で初めて出る罫は、
 *                 触るまで押せると分からないので、10px の小さな文字だと本文に埋もれる。
 */
const base =
  "cta inline-flex items-center justify-center gap-3 font-sans font-medium uppercase no-underline transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory disabled:opacity-55";

const box = "min-h-12 px-9 py-3.5 text-[11.5px] tracking-[0.2em]";
const inline = "min-h-11 text-[11px] tracking-[0.18em]";

const variants: Record<ButtonVariant, string> = {
  solid: `${box} border border-ink bg-ink text-ivory hover:border-charcoal hover:bg-charcoal`,
  outline: `${box} border border-ink text-ink hover:bg-ink hover:text-ivory`,
  "outline-light": `${box} border border-ivory/70 text-ivory hover:bg-ivory hover:text-ink`,
  link: `${inline} link-cta text-ink`,
  "link-light": `${inline} link-cta text-ivory`,
};

type Common = {
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
  /** 進む導線には矢印を付ける。戻る導線では false にする。 */
  arrow?: boolean;
};

type AsLink = Common & {
  href: ComponentProps<typeof Link>["href"];
  transitionTypes?: string[];
};

type AsButton = Common & {
  href?: undefined;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  "aria-label"?: string;
};

export function Button(props: AsLink | AsButton) {
  const { variant = "outline", className = "", children, arrow } = props;
  const showArrow = arrow ?? variant.startsWith("link");
  const cls = `${base} ${variants[variant]} ${className}`;
  const body = (
    <>
      {children}
      {showArrow ? (
        <span aria-hidden className="cta-arrow text-[1.15em] leading-none">
          →
        </span>
      ) : null}
    </>
  );

  if (props.href !== undefined) {
    return (
      <Link href={props.href} transitionTypes={props.transitionTypes} className={cls}>
        {body}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      aria-label={props["aria-label"]}
      className={cls}
    >
      {body}
    </button>
  );
}
