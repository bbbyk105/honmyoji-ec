import Image from "next/image";
import type { ReactNode } from "react";
import { ImageWell, type WellReveal } from "./ImageWell";

export type ImageRole =
  | "hero-campaign"
  | "product-still"
  | "product-detail"
  | "material-macro"
  | "process"
  | "lifestyle"
  | "journal";

export type ImageRatio = "16/10" | "4/3" | "3/4" | "4/5" | "1/1" | "16/9" | "5/4";

const ROLE_LABEL: Record<ImageRole, string> = {
  "hero-campaign": "Hero campaign",
  "product-still": "Product still life",
  "product-detail": "Product detail",
  "material-macro": "Material macro",
  "process": "Process / making",
  "lifestyle": "Lifestyle / context",
  "journal": "Journal",
};

const RATIO: Record<ImageRatio, string> = {
  "16/10": "aspect-[16/10]",
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
};

/**
 * Art-directed image well. Photography can be swapped by changing `src`.
 * Role と ratio は data-image-role / data-image-ratio 属性に残す（撮り直しの指示書はそこを読む）。
 * キャプションに刷るのは撮影メモ用なので既定は off — 読者にはただの内部記号にしか見えない。
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
}: Props) {
  return (
    <figure className={className} data-image-role={role} data-image-ratio={ratio}>
      <ImageWell
        className={`relative overflow-hidden bg-parchment ${wellClass ?? RATIO[ratio]}`}
        reveal={src ? reveal : "none"}
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
          <div className="absolute inset-0 flex flex-col items-start justify-end bg-parchment p-6">
            <p className="font-sans text-[9px] uppercase tracking-[0.28em] text-mist">{ROLE_LABEL[role]}</p>
            <p className="mt-2 font-display text-[22px] font-light italic text-charcoal/50">{ratio.replace("/", "∶")}</p>
          </div>
        )}
      </ImageWell>
      {showRole || caption ? (
        <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 font-sans text-[9.5px] uppercase tracking-[0.22em] text-mist">
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
