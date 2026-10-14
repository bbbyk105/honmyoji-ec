import type { CSSProperties } from "react";

/**
 * 作品ページの見出し。小さな区分の行（"Tatami-beri bottle bag · Medium"）の下に大きな名前。
 *
 * **区分の行も h1 に入れる**（2026-10-15、SEO チェック #43・44）。名前だけ（"Ai"）の h1 では
 * 何の品か分からず、title（"Ai 藍 — Tatami-beri bottle bag, A$170"）とも揃わない。見た目は
 * 前と同じで、二つの span がそれぞれ `hero-settle` で順に現れる。
 */
export function PieceHeading({ kind, name }: { kind: string; name: string }) {
  return (
    <h1 className="mt-12">
      <span
        className="hero-settle block font-sans text-meta text-mist"
        style={{ "--delay": "60ms" } as CSSProperties}
      >
        {kind}
      </span>{" "}
      {/* 間の空白は語をくっつけないため（textContent が "MediumAi" にならないように） */}
      <span
        className="hero-settle mt-4 block font-display text-display font-light text-ivory"
        style={{ "--delay": "120ms" } as CSSProperties}
      >
        {name}
      </span>
    </h1>
  );
}
