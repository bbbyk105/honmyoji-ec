import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export type ButtonVariant = "solid" | "outline" | "outline-light" | "link" | "link-light";

/**
 * サイト共通のボタン。
 *
 *  solid          その画面で一番やってほしいこと（カートに入れる・送る）。黒地なので塗りは光の側
 *  outline        次点（別の作品を見る・問い合わせる）
 *  outline-light  写真の上。地が黒になってからは罫が 70% 弱いだけの違い —— 写真の上で
 *                 100% の白枠は切り抜きに見えるので、この一段は残してある
 *  link / -light  文中・見出し脇の導線。罫は「常に」引く — hover で初めて出る罫は、
 *                 触るまで押せると分からないので、10px の小さな文字だと本文に埋もれる。
 *                 `-light` は今は link と同値だが、呼び出し側が「写真の上」と言えるよう残す
 */
const base =
  "cta inline-flex items-center justify-center gap-3 font-sans font-medium uppercase no-underline transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-ivory/30 focus-visible:ring-offset-2 focus-visible:ring-offset-sumi disabled:opacity-55";

const box = "min-h-12 px-9 py-3.5 text-[11.5px] tracking-[0.2em]";
const inline = "min-h-11 text-[11px] tracking-[0.18em]";

const variants: Record<ButtonVariant, string> = {
  solid: `${box} border border-ivory bg-ivory text-sumi hover:border-bone hover:bg-bone`,
  outline: `${box} border border-ivory text-ivory hover:bg-ivory hover:text-sumi`,
  "outline-light": `${box} border border-ivory/70 text-ivory hover:bg-ivory hover:text-sumi`,
  link: `${inline} link-cta text-ivory`,
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
  /**
   * 一覧 ⇄ 商品ページの導線。遷移の幕（`RouteCurtain`）を出さずに、
   * 720ms の bag morph に任せる。幕を掛けるとモーフが幕の下で終わる。
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
