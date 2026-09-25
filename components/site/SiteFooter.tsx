import Link from "next/link";
import { site } from "@/data/site";
import { SHELL } from "./Shell";
import { Newsletter } from "./Newsletter";

const footerNav = [
  ...site.nav,
  { href: "/faq", label: "FAQ" },
  { href: "/legal", label: "Legal" },
] as const;

/**
 * フッターは墨の面。紙の節で終わるページでも、最後は必ず墨に戻る（堂を出る）。
 *
 * 行き先は大文字の小さな列ではなく、本文と同じ書き方の語で並べる（2026-09-25）。
 * 10.5px・字間 0.24em の大文字が六つ縦に並んでいたのが、ここを一番テンプレートらしく見せていた。
 * 大文字が残るのはヘッダーのナビと CTA だけ。
 */
export function SiteFooter() {
  return (
    <footer className="surface-dark border-t border-line">
      <div className={`${SHELL} grid gap-14 pb-16 pt-beat md:grid-cols-12 md:gap-8 md:pb-20`}>
        <div className="md:col-span-5">
          <p className="mr-[-0.24em] font-mark text-[23px] font-light leading-none tracking-[0.24em] text-ivory">MIROKU</p>
          <p className="mt-10 max-w-[18ch] font-display text-title font-light text-ivory">
            Woven once, at the edge of a tatami room.
          </p>
          <p lang="ja" className="mt-4 font-jp text-[14px] tracking-[0.06em] text-mist">
            畳の縁から、一本ずつ。
          </p>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 content-start gap-x-8 gap-y-3.5 md:col-span-3 md:col-start-7">
          {footerNav.map((item) => (
            <Link key={item.href} href={item.href} className="link-line w-fit font-sans text-[15px] text-bone hover:text-ivory">
              {item.label}
            </Link>
          ))}
          <a
            href={site.instagram}
            target="_blank"
            rel="noreferrer"
            className="link-line w-fit font-sans text-[15px] text-bone hover:text-ivory"
          >
            Instagram
          </a>
        </nav>

        <div className="md:col-span-3 md:col-start-10">
          <Newsletter />
          <p className="mt-10 font-sans text-meta text-mist">
            {site.location}
            <br />
            <a href={`mailto:${site.email}`} className="link-line text-bone hover:text-ivory">
              {site.email}
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-line">
        <div className={`${SHELL} flex flex-col gap-1 py-6 font-sans text-meta text-mist md:flex-row md:items-center md:justify-between`}>
          <span>© 2026 {site.name}</span>
          <span>Handmade at Honmyoji, Fuji, Japan</span>
        </div>
      </div>
    </footer>
  );
}
