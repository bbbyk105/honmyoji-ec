import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Nunito_Sans, Poppins, Prompt } from "next/font/google";
import "./globals.css";
import { site } from "@/data/site";

/**
 * html と body、そしてフォントだけ。
 *
 * ヘッダー・フッター・カート・Lenis は `app/(site)/layout.tsx` が持つ。
 * ここに置くと `/studio` にもサイトの外枠が付いてきて、親 layout は子から外せない。
 */

/*
  書体は三つとも OFL（2026-09-25 に Newsreader / Albert Sans から入れ替えた）。
  next/font がビルド時に取り込んで同じオリジンから配るので、Google にも他所の CDN にも取りに行かない。

  **先読み（preload）はどのページでも第一画面に出る三枚だけ**: Poppins 300・Nunito Sans の立体・Prompt 300。
  先読みは写真（LCP）と回線を取り合うので、一枚増やすたびに第一画面が遅れる。

  日本語は Web フォントを読まない（`--font-jp` は端末の明朝。globals.css）。以前は Shippori Mincho を
  読んでいたが、和文は文字ごとに約 120 のファイルに割られて配られ、その `@font-face` 245 個が
  184KB の CSS になって全ページの描画を止めていた。漢字の多い一覧では 30 本近いファイルを取りに行っていた。
*/

/* 見出し。可変フォントではないので使う太さだけ —— 300 の一枚。`font-display` には必ず `font-light` を添える */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: "300",
  display: "swap",
});

/* 本文と UI。可変フォントなので太さは指定しない（400 / 500 / 600 が一本で出る） */
const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

/*
  斜体は Blog の em だけなので、呼び出しを分けて先読みしない（使われたページでだけ取りに行く）。
  同じ呼び出しに style: ["normal", "italic"] で入れると、斜体まで全ページで先読みされる。
*/
const nunitoItalic = Nunito_Sans({
  variable: "--font-nunito-italic",
  subsets: ["latin"],
  style: "italic",
  display: "swap",
  preload: false,
});

/* ワードマーク（MIROKU）だけ。この一語のために 300 の一枚だけを読む */
const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["latin"],
  weight: "300",
  display: "swap",
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
      className={`${poppins.variable} ${nunito.variable} ${nunitoItalic.variable} ${prompt.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-sumi text-ivory">{children}</body>
    </html>
  );
}
