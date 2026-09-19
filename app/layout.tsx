import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Bodoni_Moda, Manrope, Shippori_Mincho } from "next/font/google";
import "./globals.css";
import { site } from "@/data/site";

/**
 * html と body、そしてフォントだけ。
 *
 * ヘッダー・フッター・カート・Lenis は `app/(site)/layout.tsx` が持つ。
 * ここに置くと `/studio` にもサイトの外枠が付いてきて、親 layout は子から外せない。
 */

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
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
      className={`${bodoni.variable} ${manrope.variable} ${shippori.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-sumi text-ivory">{children}</body>
    </html>
  );
}
