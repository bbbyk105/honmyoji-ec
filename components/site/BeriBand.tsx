type Props = {
  texture?: "beri-wide" | "beri-indigo" | "beri-sakura" | "beri-matsu";
  className?: string;
};

/**
 * 畳の縁の帯。畳の縁が畳を縁取るように、ページの区切りを縁取る。
 * 「縁」= tatami edge と、人と人の en（ご縁）を同じ一文字で背負わせた、このサイトの署名。
 */
export function BeriBand({ texture = "beri-wide", className = "" }: Props) {
  return (
    <div
      aria-hidden
      className={`beri-band h-10 w-full md:h-14 ${className}`}
      style={{ backgroundImage: `url(/images/texture/${texture}.webp)` }}
    />
  );
}
