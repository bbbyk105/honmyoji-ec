import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Newsreader, Source_Sans_3, Shippori_Mincho } from "next/font/google";
import "./globals.css";
import { site } from "@/data/site";

/**
 * html と body、そしてフォントだけ。
 *
 * ヘッダー・フッター・カート・Lenis は `app/(site)/layout.tsx` が持つ。
 * ここに置くと `/studio` にもサイトの外枠が付いてきて、親 layout は子から外せない。
 */

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const shippori = Shippori_Mincho({
  variable: "--font-shippori",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${site.name} — Tatami-beri bags, made once`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: `${site.name} — Tatami-beri bags, made once`,
    description: site.description,
    type: "website",
    locale: "en_US",
    images: [{ url: "/images/scenes/hero-tatami.webp" }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      /*
        入場の幕を「もう見たか」の印（`data-entered`）は、SiteChrome が body の先頭に置く
        一行の script が**塗る前に**付ける。サーバの HTML には無い属性なので、
        これが無いと二度目の訪問で毎回 hydration mismatch が出る（実際に踏んだ）。
        抑えるのは html 自身の属性だけで、子孫の不一致は今までどおり報告される。
      */
      suppressHydrationWarning
      className={`${newsreader.variable} ${sourceSans.variable} ${shippori.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-sumi text-ivory">{children}</body>
    </html>
  );
}
