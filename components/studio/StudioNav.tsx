"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/studio/actions";
import { STUDIO_SHELL } from "@/components/studio/shell";

/**
 * 管理画面のナビ。サイトのヘッダーとは別物。
 *
 * 墨の帯には「どこにいるか」（ワードマーク・タブ）だけを置く。数字や表は帯の下の
 * 紙の面に出す（fujisan の管理画面と同じ組み）。タブは日本語で、現在地は字の明暗と
 * 下の罫の二つで示す —— 英語の小さな大文字は、一日に何度も見る画面では読みにくかった。
 */

const LINKS = [
  { href: "/studio", label: "ダッシュボード" },
  { href: "/studio/pieces", label: "作品・在庫" },
  { href: "/studio/orders", label: "注文" },
] as const;

const SMALL =
  "font-sans text-[13px] text-mist no-underline transition-colors duration-200 hover:text-ivory";

export function StudioNav() {
  const pathname = usePathname();

  return (
    <header className="surface-dark">
      <div className={`${STUDIO_SHELL} flex items-center gap-6 pt-5`}>
        <Link href="/studio" className="shrink-0 no-underline">
          <span className="font-mark text-[20px] font-light leading-none tracking-[0.02em] text-ivory">
            MIROKU
          </span>
          <span className="ml-3 font-sans text-[13px] text-mist">管理画面</span>
        </Link>

        <div className="ml-auto flex items-center gap-6">
          <Link href="/" target="_blank" className={SMALL}>
            サイトを見る ↗
          </Link>
          <form action={signOut}>
            <button type="submit" className={`cursor-pointer ${SMALL}`}>
              ログアウト
            </button>
          </form>
        </div>
      </div>

      <div className={STUDIO_SHELL}>
        <nav aria-label="管理メニュー" className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
          <ul className="mt-4 flex min-w-max gap-8 border-b border-line">
            {LINKS.map((link) => {
              const active =
                link.href === "/studio" ? pathname === "/studio" : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`-mb-px block border-b-2 pb-3.5 pt-1 font-sans text-[14.5px] no-underline transition-colors ${
                      active
                        ? "border-ivory font-semibold text-ivory"
                        : "border-transparent text-mist hover:text-ivory"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
