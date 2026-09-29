/**
 * 管理画面の版面と、画面をまたいで同じ形で出てくる部品のクラス。
 *
 * 管理画面は紙の面（`app/studio/layout.tsx` の `surface-paper`）。`bg-ivory` は墨色、
 * `text-sumi` は紙色になる —— 塗りのボタンは墨の地に紙の字。
 */
export const STUDIO_SHELL = "mx-auto w-full max-w-[1240px] px-5 md:px-10";

/** 画面の見出しの上下。全ページで同じにする。 */
export const STUDIO_HEAD = "pb-8 pt-10 md:pt-12";

/** 表・囲みの台紙。紙より一段明るい（fujisan の管理画面の組み）。 */
export const STUDIO_CARD = "border border-line bg-card";

/** 保存する・変更する —— その画面で値が動く一つ。 */
export const BTN_SOLID =
  "inline-flex min-h-11 cursor-pointer items-center justify-center border border-ivory bg-ivory px-6 font-sans text-[14px] font-semibold text-sumi transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-35";

/** 解除・取り消し。押せることは分かるが、主役の隣で目立たない。 */
export const BTN_QUIET =
  "cursor-pointer font-sans text-[13px] text-mist underline decoration-line underline-offset-4 transition-colors hover:text-ivory hover:decoration-ivory disabled:cursor-not-allowed disabled:opacity-40";

/** 戻る・別画面へ、の小さなリンク。 */
export const LINK_QUIET =
  "font-sans text-[13px] text-mist no-underline transition-colors hover:text-ivory";
