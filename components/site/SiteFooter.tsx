import Link from "next/link";
import { site } from "@/data/site";
import { SHELL } from "./Shell";
import { Newsletter } from "./Newsletter";

const footerNav = [
  ...site.nav,
  { href: "/faq", label: "FAQ" },
  { href: "/legal", label: "Legal" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line md:mt-28">
      <div className={`${SHELL} grid gap-14 py-16 md:grid-cols-[1.3fr_0.8fr_1.1fr] md:gap-16 md:py-20`}>
        <div>
          <p className="font-sans text-[13px] font-medium tracking-[0.42em] text-ink">MIROKU</p>
          <p className="mt-6 max-w-[28ch] font-display text-[26px] font-light leading-[1.3] text-ink">
            Woven once, at the edge of a tatami room.
          </p>
          <p className="mt-3 font-jp text-[12px] tracking-[0.16em] text-mist">畳の縁から、一本ずつ。</p>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-3 content-start">
          {footerNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="link-line w-fit font-sans text-[10.5px] uppercase tracking-[0.24em] text-charcoal/80"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={site.instagram}
            target="_blank"
            rel="noreferrer"
            className="link-line w-fit font-sans text-[10.5px] uppercase tracking-[0.24em] text-charcoal/80"
          >
            Instagram
          </a>
        </nav>

        <div className="max-w-[320px]">
          <Newsletter />
          <p className="mt-8 font-sans text-[11px] leading-[1.8] text-mist">
            {site.location}
            <br />
            <a href={`mailto:${site.email}`} className="link-line text-charcoal/80">
              {site.email}
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-line">
        <div className={`${SHELL} flex flex-col gap-2 py-5 font-sans text-[9.5px] uppercase tracking-[0.22em] text-mist md:flex-row md:items-center md:justify-between`}>
          <span>© 2026 {site.name}</span>
          <span>Handmade in Fuji, Japan</span>
        </div>
      </div>
    </footer>
  );
}
