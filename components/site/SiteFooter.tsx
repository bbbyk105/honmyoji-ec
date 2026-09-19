import Link from "next/link";
import { site } from "@/data/site";
import { SHELL } from "./Shell";

const footerNav = [
  ...site.nav,
  { href: "/faq", label: "FAQ" },
  { href: "/legal", label: "Legal" },
] as const;

export function SiteFooter() {
  const hasInstagram =
    site.instagram !== "https://www.instagram.com/" && site.instagram !== "https://instagram.com/";

  return (
    <footer className="mt-24 border-t border-line bg-onyx md:mt-36">
      <div className={SHELL + " py-14 md:py-20"}>
        <p className="font-display text-[clamp(56px,10vw,144px)] font-light leading-[0.78] tracking-[-0.045em] text-ivory">
          MIROKU
        </p>

        <div className="mt-12 grid gap-12 border-t border-line pt-8 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <p className="max-w-[30ch] font-display text-[26px] font-light leading-[1.3] text-ivory">
              Woven once, at the edge of a tatami room.
            </p>
            <p className="mt-4 font-jp text-[12px] tracking-[0.16em] text-mist">
              畳の縁から、一本ずつ。
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 content-start gap-x-7 gap-y-3 md:col-span-4 md:col-start-7"
          >
            {footerNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="link-line w-fit font-sans text-[10.5px] uppercase tracking-[0.22em] text-bone/75"
              >
                {item.label}
              </Link>
            ))}
            {hasInstagram ? (
              <a
                href={site.instagram}
                target="_blank"
                rel="noreferrer"
                className="link-line w-fit font-sans text-[10.5px] uppercase tracking-[0.22em] text-bone/75"
              >
                Instagram
              </a>
            ) : null}
          </nav>

          <div className="md:col-span-3 md:col-start-10">
            <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-mist">Honmyoji Temple</p>
            <p className="mt-3 max-w-[24ch] font-sans text-[12px] leading-[1.8] text-bone/72">
              Fuji City, Shizuoka, Japan
            </p>
            <Link
              href="/contact"
              className="link-cta mt-5 inline-flex min-h-11 items-center font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-ivory no-underline"
            >
              Contact
              <span aria-hidden className="cta-arrow ml-3 text-[1.15em] leading-none">
                →
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className={SHELL + " flex flex-col gap-2 py-5 font-sans text-[9.5px] uppercase tracking-[0.2em] text-mist md:flex-row md:items-center md:justify-between"}>
          <span>© 2026 {site.name}</span>
          <span>Handmade in Fuji, Japan</span>
        </div>
      </div>
    </footer>
  );
}
