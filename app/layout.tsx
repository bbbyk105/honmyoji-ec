import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Albert_Sans, Newsreader, Shippori_Mincho } from "next/font/google";
import "./globals.css";
import { site } from "@/data/site";

/**
 * html と body、そしてフォントだけ。
 *
 * ヘッダー・フッター・カート・Lenis は `app/(site)/layout.tsx` が持つ。
 * ここに置くと `/studio` にもサイトの外枠が付いてきて、親 layout は子から外せない。
 */

/*
  見出しの Newsreader は**可変フォントのまま光学サイズ軸（opsz）ごと**読む。
  weight を配列で指定すると opsz 16（本文用）の一枚だけが届き、80px の見出しまで本文の字で
  組むことになる —— 太く、間延びして見えていたのはこれ（2026-09-25）。軸を開けておけば
  ブラウザが字の大きさに合わせて opsz を選ぶ（`font-optical-sizing: auto` が既定）。
*/
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

/*
  本文と UI。Satoshi 系の幾何学的なグロテスク。Satoshi そのものは ITF FFL が公開リポジトリでの
  配布を禁じているので使わない（このリポジトリは公開）。Albert Sans は OFL で、next/font が
  ビルド時に取り込んで同じオリジンから配る。
*/
const albert = Albert_Sans({
  variable: "--font-albert",
  subsets: ["latin"],
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
    images: [{ url: "/images/scenes/altar-standing.webp" }],
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
      className={`${newsreader.variable} ${albert.variable} ${shippori.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-sumi text-ivory">{children}</body>
    </html>
  );
}
