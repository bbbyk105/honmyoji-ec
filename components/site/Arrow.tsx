/**
 * 進む導線の矢印。字の「→」ではなく一本の罫で描く。
 *
 * 書体の矢印は字の太さで描かれるので、11.5px の大文字の隣では語より重く見え、
 * 書体を替えるたびに形も変わった（2026-09-25）。罫と同じ 1px の線にしておくと、
 * CTA の下の罫・節の罫と同じ線の仲間になる。
 *
 * 動かすのは呼び出し側の `.cta-arrow`（hover で 4px 進む）。
 */
export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 22 9"
      width="22"
      height="9"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      className={`shrink-0 overflow-visible ${className}`}
    >
      <path d="M0 4.5h21M17 0.5l4 4-4 4" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
