import Image from "next/image";
import type { ReactNode } from "react";
import { ImageWell, type WellFrom, type WellReveal } from "./ImageWell";

export type ImageRole =
  | "hero-campaign"
  | "product-still"
  | "product-detail"
  | "material-macro"
  | "process"
  | "lifestyle"
  | "blog";

export type ImageRatio = "16/10" | "3/2" | "4/3" | "3/4" | "4/5" | "1/1" | "16/9" | "5/4";

const ROLE_LABEL: Record<ImageRole, string> = {
  "hero-campaign": "Hero campaign",
  "product-still": "Product still life",
  "product-detail": "Product detail",
  "material-macro": "Material macro",
  "process": "Process / making",
  "lifestyle": "Lifestyle / context",
  "blog": "Blog",
};

const RATIO: Record<ImageRatio, string> = {
  "16/10": "aspect-[16/10]",
  "3/2": "aspect-[3/2]",
  "4/3": "aspect-[4/3]",
  "3/4": "aspect-[3/4]",
  "4/5": "aspect-[4/5]",
  "1/1": "aspect-square",
  "16/9": "aspect-video",
  "5/4": "aspect-[5/4]",
};

type Props = {
  src?: string;
  alt: string;
  role: ImageRole;
  ratio: ImageRatio;
  caption?: string;
  crop?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  wellClass?: string;
  children?: ReactNode;
  showRole?: boolean;
  /** 写真の出方。既定は下端から開く wipe。ヒーローだけ band（中央から左右へ）。 */
  reveal?: WellReveal;
  /** マスクが開く向き。**版面のどの端に着いている写真か**で決める（`ImageWell` の註）。 */
  from?: WellFrom;
  /** 隣り合う写真をずらす（ms）。同時に開くと一組の仕掛けに見える。 */
  revealDelay?: number;
  /**
   * 撮ったままの比率（幅 / 高さ）。渡すと `ratio` のクラスより優先する。商品ページの
   * ギャラリー用 —— 決まった比率に押し込むと、縦位置の写真は持ち手か床が切れる。
   */
  aspect?: number;
};

/**
 * Art-directed image well. Photography can be swapped by changing `src`.
 * Role と ratio は data-image-role / data-image-ratio 属性に残す（撮り直しの指示書はそこを読む）。
 * キャプションに刷るのは撮影メモ用なので既定は off — 読者にはただの内部記号にしか見えない。
 *
 * **公開ページの写真にキャプションを付けない**（2026-09-25）。「Corridor, Honmyoji」
 * 「Ai · detail」のような 9.5px の大文字の添え書きが写真の下に一枚ずつ並んでいて、
 * 何も言っていないのに一番テンプレートらしく見えていた。`caption` は Blog の本文
 * （CMS の画像説明）のためだけに残してあり、そこでも文と同じ書き方で出す。
 */
export function Frame({
  src,
  alt,
  role,
  ratio,
  caption,
  crop = "object-cover",
  priority = false,
  sizes = "100vw",
  className = "",
  wellClass,
  children,
  showRole = false,
  reveal = "wipe",
  from = "bottom",
  revealDelay = 0,
  aspect,
}: Props) {
  return (
    <figure className={className} data-image-role={role} data-image-ratio={ratio}>
      <ImageWell
        className={`relative overflow-hidden bg-sumi ${aspect ? "" : (wellClass ?? RATIO[ratio])}`}
        style={aspect ? { aspectRatio: String(aspect) } : undefined}
        reveal={src ? reveal : "none"}
        from={from}
        delay={revealDelay}
        overlay={children}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes={sizes}
            className={crop}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-start justify-end bg-sumi p-6 ring-1 ring-inset ring-line">
            <p className="font-sans text-meta text-mist">{ROLE_LABEL[role]}</p>
            <p className="mt-2 font-display text-[22px] font-light text-bone/50">{ratio.replace("/", "∶")}</p>
          </div>
        )}
      </ImageWell>
      {showRole || caption ? (
        <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 font-sans text-meta text-mist">
          <span>{caption ?? alt}</span>
          {showRole ? (
            <span className="text-mist/70">
              {ROLE_LABEL[role]} · {ratio.replace("/", "∶")}
            </span>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
