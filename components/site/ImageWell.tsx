"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "@/components/motion/reduced-motion";
import { DUR, EASE } from "@/components/motion/tokens";
import "@/components/motion/register";

export type WellReveal = "wipe" | "band" | "none";

/**
 * マスクが開く向き。**写真が版面のどの端に着いているかで決める。**
 * 左端いっぱいの写真は左から、右端いっぱいの写真は右から開く —— 余白から引き出される
 * ように見え、隣り合う二枚が互いに向き合って開く。既定は下（単独で置かれた写真）。
 */
export type WellFrom = "bottom" | "left" | "right" | "top";

type Props = {
  className?: string;
  /** 比率を数値で渡すとき（撮ったままの比率で置くギャラリー）。クラスで書けない値だけに使う。 */
  style?: CSSProperties;
  /** マスクの中に入る本体（写真）。ここだけが開く。 */
  children: ReactNode;
  /** 見出しやグラデーションなど、マスクの外に置く重ね物。開いている間も動かない。 */
  overlay?: ReactNode;
  reveal?: WellReveal;
  from?: WellFrom;
  /** 隣り合う写真をずらすため（ms）。同時に開くと一組の仕掛けに見える。 */
  delay?: number;
};

/** 閉じた状態の clip-path。開くと全部 inset(0%) になる。 */
const CLOSED: Record<WellFrom, string> = {
  bottom: "inset(100% 0% 0% 0%)",
  top: "inset(0% 0% 100% 0%)",
  left: "inset(0% 100% 0% 0%)",
  right: "inset(0% 0% 0% 100%)",
};

/**
 * 像の倍率。**動かさない** —— 平行移動で端が欠けないぶんの余白として要るだけで、
 * 寄りの演出ではない。掛けるのは実際にマスクが開くときだけ。
 */
const SCALE = 1.04;

/** 掃く向きと逆に置いて、マスクに遅れて追いつかせる量（%）。 */
const LAG: Record<WellFrom, { x?: number; y?: number }> = {
  bottom: { y: 2.5 },
  top: { y: -2.5 },
  left: { x: -2.5 },
  right: { x: 2.5 },
};

/**
 * 写真の井戸。写真は「フェードイン」ではなく「開く」。
 *
 *  wipe — 端の一つからマスクが開く（向きは `from`）
 *  band — 中央の細い帯が左右へ広がって全面になる（読み込み時。ヒーロー用）
 *
 * **像そのものは拡大縮小しない**（2026-09-20）。以前は 1.12 倍から実寸へ寄せていたが、
 * マスクと同時に動かすと一枚の写真に効果が二つ乗り、寄りの動き自体もどこかで見た
 * 「写真が寄ってくる演出」になる。いま動くのは**マスクの端**と、それに遅れて追いつく
 * 2.5% の平行移動だけ —— 窓が開いて、奥の写真が少し遅れて据わる。倍率は 1.04 で固定
 * （動かさない）。平行移動で端が欠けないぶんの余白として要る。
 *
 * マスクは井戸そのものではなく内側の層に掛ける。井戸ごと切ると、
 * 上に載せた見出しまで一緒に切れてしまう。
 */
export function ImageWell({
  className = "",
  style,
  children,
  overlay,
  reveal = "wipe",
  from = "bottom",
  delay = 0,
}: Props) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || reveal === "none") return;
      if (prefersReducedMotion()) return;

      const mask = el.querySelector<HTMLElement>("[data-well-mask]");
      const shift = el.querySelector<HTMLElement>("[data-well-shift]");
      if (!mask) return;

      if (reveal === "band") {
        const tl = gsap.timeline();
        tl.fromTo(
          mask,
          { clipPath: "inset(0% 44% 0% 44%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: EASE },
        );
        /* 像は動かさない。倍率は平行移動が無いので要らない（井戸と同じ 1:1 で開く）。 */
        return;
      }

      const tl = gsap.timeline({
        delay: delay / 1000,
        scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" },
      });
      tl.fromTo(
        mask,
        { clipPath: CLOSED[from] },
        { clipPath: "inset(0% 0% 0% 0%)", duration: DUR.image, ease: EASE },
      );
      if (shift) {
        gsap.set(shift, { scale: SCALE });
        const lag = LAG[from];
        tl.fromTo(
          shift,
          { xPercent: lag.x ?? 0, yPercent: lag.y ?? 0 },
          { xPercent: 0, yPercent: 0, duration: DUR.image + 0.2, ease: EASE },
          0,
        );
      }
    },
    { scope: root, dependencies: [reveal, from, delay] },
  );

  return (
    <div ref={root} className={className} style={style}>
      <div data-well-mask className="absolute inset-0">
        {/*
          平行移動する層。倍率は**クラスではなく effect で**置く（`SCALE`）。
          クラスで固定すると、写真の無い空の井戸（`Frame` の役割 + 比率を罫で囲うやつ）まで
          1.04 倍になり、四辺の罫が枠の外へ出て消える。動きを止める設定でも同じ。
        */}
        <div data-well-shift className="absolute inset-0">
          {children}
        </div>
      </div>
      {overlay}
    </div>
  );
}
