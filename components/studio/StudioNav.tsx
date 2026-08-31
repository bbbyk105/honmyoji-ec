"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/studio/actions";
import { STUDIO_SHELL } from "@/components/studio/shell";

/**
 * 管理画面のナビ。サイトのヘッダーとは別物 —— こちらは版面いっぱいの一本の帯で、
 * ハンバーガーもカートも無い。現在地は色と罫の二つで示す（色だけだと ivory 地の
 * 上では差が小さすぎる）。
 */

const LINKS = [
  { href: "/studio", label: "Overview" },
  { href: "/studio/pieces", label: "Pieces" },
  { href: "/studio/orders", label: "Orders" },
] as const;

export function StudioNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-line bg-paper">
      <div className={`${STUDIO_SHELL} flex h-16 items-center gap-8`}>
        <Link href="/studio" className="shrink-0 no-underline">
          <span className="font-display text-[19px] font-light leading-none tracking-[0.02em] text-ink">
            MIROKU
          </span>
          <span className="ml-2.5 font-sans text-[9.5px] font-medium uppercase tracking-[0.28em] text-mist">
            Studio
          </span>
        </Link>

        <nav className="flex items-center gap-7">
          {LINKS.map((link) => {
            const active =
              link.href === "/studio" ? pathname === "/studio" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`border-b py-1 font-sans text-[10.5px] font-medium uppercase tracking-[0.24em] no-underline transition-colors duration-200 ${
                  active
                    ? "border-ink text-ink"
                    : "border-transparent text-mist hover:text-charcoal"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-6">
          <Link
            href="/"
            className="font-sans text-[10.5px] font-medium uppercase tracking-[0.24em] text-mist no-underline transition-colors duration-200 hover:text-charcoal"
          >
            View site
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="cursor-pointer font-sans text-[10.5px] font-medium uppercase tracking-[0.24em] text-mist transition-colors duration-200 hover:text-clay"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
