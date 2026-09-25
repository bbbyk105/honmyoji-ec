import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Arrow } from "./Arrow";

export type ButtonVariant = "solid" | "link";

/**
 * サイト共通のボタン。**二種類だけ**（2026-09-25）。
 *
 *  solid  買う・送る・知らせてもらう —— その画面でお金か連絡先が動く一つだけ。
 *         面の一番強い色で塗る（墨の面では生成り、紙の面では墨）
 *  link   それ以外の全部。語・罫・矢印だけで立つ。罫は常に薄く引いてあり（押せると分かる）、
 *         触れると濃い罫が左から引かれて矢印が 4px 進む
 *
 * 以前は罫で囲った四角（outline）が「The collection」「The maker and the place」など
 * 案内の導線ごとに並んでいて、四角の数だけテンプレートに見えた。四角は一画面に一つまで。
 * 角丸・影・反転する塗りは使わない。
 */
const base =
  "cta inline-flex items-center font-sans no-underline outline-none transition-[color,background-color,border-color,opacity] duration-500 ease-[var(--ease-soft)] focus-visible:ring-1 focus-visible:ring-ivory/40 focus-visible:ring-offset-4 focus-visible:ring-offset-sumi disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  solid:
    "caps min-h-[52px] justify-center gap-5 border border-ivory bg-ivory px-8 text-sumi hover:bg-ivory/88",
  link: "caps link-cta min-h-11 gap-7 text-ivory",
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
  /**
   * 一覧 ⇄ 商品ページの導線。ページが開く所作を出さずに、720ms の bag morph に任せる
   * （`PageTransition`）。
   */
  morph?: boolean;
};

type AsButton = Common & {
  href?: undefined;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  "aria-label"?: string;
};

export function Button(props: AsLink | AsButton) {
  const { variant = "link", className = "", children, arrow } = props;
  const showArrow = arrow ?? variant === "link";
  const cls = `${base} ${variants[variant]} ${className}`;
  const body = (
    <>
      <span className={variant === "link" ? "cta-label" : undefined}>{children}</span>
      {showArrow ? <Arrow className="cta-arrow" /> : null}
    </>
  );

  if (props.href !== undefined) {
    return (
      <Link
        href={props.href}
        transitionTypes={props.transitionTypes}
        data-morph={props.morph ? "" : undefined}
        className={cls}
      >
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
