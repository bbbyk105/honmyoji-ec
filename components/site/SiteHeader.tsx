"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useCart } from "@/components/cart/CartProvider";
import { startLenis, stopLenis } from "@/components/motion/SmoothScroll";
import { site } from "@/data/site";
import { SHELL } from "./Shell";
import "@/components/motion/register";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  /**
   * 閉じ方は二種類ある。
   *  reverse — 「閉じる」だけの操作（X / Esc）。開いた所作をそのまま巻き戻す
   *  instant — 行き先を選んだとき。ここで巻き戻すと 1.19 秒（リンクの stagger →
   *            clip-path ワイプ）かかり、その間に View Transition がヘッダーを
   *            固定するので、新しいページの上にメニューが乗ったまま止まって見える。
   * open と同じコミットで決まるので、GSAP 側は open の変化だけ見ていればいい。
   */
  const [closeMode, setCloseMode] = useState<"reverse" | "instant">("reverse");
  const [pathWhenOpened, setPathWhenOpened] = useState(pathname);
  const [scrolled, setScrolled] = useState(false);
  const { slugs, setOpen: setCartOpen } = useCart();
  const root = useRef<HTMLElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const items = useRef<HTMLUListElement>(null);
  const lineA = useRef<HTMLSpanElement>(null);
  const lineB = useRef<HTMLSpanElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname !== pathWhenOpened) {
    setPathWhenOpened(pathname);
    setCloseMode("instant");
    setOpen(false);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setCloseMode("reverse");
      setOpen(false);
    };
    const mq = window.matchMedia("(min-width: 1280px)");
    const onWide = () => {
      if (!mq.matches) return;
      // 幅で消えるときに巻き戻しを見せる相手はいない
      setCloseMode("instant");
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onWide);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onWide);
    };
  }, []);

  useGSAP(
    () => {
      if (!overlay.current || !items.current) return;
      const links = items.current.querySelectorAll("li");
      const foot = overlay.current.querySelectorAll("[data-menu-foot]");

      gsap.set(overlay.current, { autoAlpha: 0, pointerEvents: "none" });
      gsap.set(links, { y: 28, autoAlpha: 0 });
      gsap.set(foot, { y: 12, autoAlpha: 0 });

      tl.current = gsap
        .timeline({ paused: true, defaults: { ease: "power3.out" } })
        .set(overlay.current, { pointerEvents: "auto" })
        .to(overlay.current, { autoAlpha: 1, duration: 0.45, ease: "power2.out" }, 0)
        .fromTo(
          overlay.current,
          { clipPath: "inset(0 0 100% 0)" },
          { clipPath: "inset(0 0 0% 0)", duration: 0.72, ease: "power4.inOut" },
          0,
        )
        .to(links, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.07 }, 0.28)
        .to(foot, { y: 0, autoAlpha: 1, duration: 0.5 }, 0.55);
    },
    { scope: root },
  );

  useGSAP(
    () => {
      if (!tl.current || !lineA.current || !lineB.current || !overlay.current) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (open) {
        stopLenis();
        document.body.style.overflow = "hidden";
        tl.current.timeScale(1);
        if (reduced) {
          gsap.set(overlay.current, { autoAlpha: 1, clipPath: "none", pointerEvents: "auto" });
          gsap.set(items.current?.querySelectorAll("li") ?? [], { y: 0, autoAlpha: 1 });
          gsap.set(overlay.current.querySelectorAll("[data-menu-foot]"), { y: 0, autoAlpha: 1 });
        } else {
          tl.current.play();
        }
        gsap.to(lineA.current, { y: 4.5, rotate: 45, duration: reduced ? 0 : 0.45, ease: "power3.inOut" });
        gsap.to(lineB.current, { y: -4.5, rotate: -45, duration: reduced ? 0 : 0.45, ease: "power3.inOut" });
      } else {
        startLenis();
        document.body.style.overflow = "";
        const instant = reduced || closeMode === "instant";
        if (instant) {
          // pause(0) で中身は開く前の位置へ戻る。pointerEvents だけは 0 秒地点の
          // set() が効いたままなので、明示的に落とす。
          tl.current.pause(0);
          gsap.set(overlay.current, { autoAlpha: 0, pointerEvents: "none" });
        } else {
          // 閉じるときは開くときの倍速。1.19 秒はメニューが居座って見える。
          tl.current.timeScale(2).reverse();
        }
        const iconDuration = instant ? 0 : 0.4;
        gsap.to(lineA.current, { y: 0, rotate: 0, duration: iconDuration, ease: "power3.inOut" });
        gsap.to(lineB.current, { y: 0, rotate: 0, duration: iconDuration, ease: "power3.inOut" });
      }
    },
    // deps は open だけ。closeMode も入れると、カートを開くとき（open は false のまま
    // closeMode だけ変わる）に閉じる側の処理が再実行され、MiniCart が掛けた
    // stopLenis / body overflow を打ち消してしまう。値は同じコミットで確定するので読めている。
    { dependencies: [open] },
  );

  /** 閉じるだけ（X / Esc）。開いた所作を巻き戻す。 */
  const dismiss = () => {
    setCloseMode("reverse");
    setOpen(false);
  };

  /** 行き先を選んだとき。メニューは即座に退く。 */
  const leave = () => {
    setCloseMode("instant");
    setOpen(false);
  };

  return (
    <header
      ref={root}
      style={{ viewTransitionName: "site-header" }}
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-500 ${
        scrolled && !open ? "border-b border-line/80 bg-ivory/92" : "border-b border-transparent bg-transparent"
      }`}
    >
      {/* 三分割グリッド。flex + justify-between だと nav が中途半端な位置に落ちる */}
      <div className={`${SHELL} grid h-16 grid-cols-[1fr_auto_1fr] items-center sm:h-[72px] md:h-[80px]`}>
        <Link
          href="/"
          onClick={leave}
          className="z-[60] col-start-1 justify-self-start no-underline"
          aria-label={`${site.name} — home`}
        >
          <span className="block font-display text-[20px] font-light leading-none tracking-[0.18em] text-ink sm:text-[23px]">
            MIROKU
          </span>
          <span className="mt-[7px] block font-sans text-[8px] uppercase tracking-[0.3em] text-mist">
            Honmyoji · Fuji
          </span>
        </Link>

        <nav aria-label="Primary" className="col-start-2 hidden justify-self-center xl:flex xl:items-center xl:gap-10">
          {site.nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative font-sans text-[10.5px] uppercase tracking-[0.22em] transition-colors duration-300 ${
                  active ? "text-ink" : "link-line text-charcoal/65 hover:text-ink"
                }`}
              >
                {item.label}
                {active ? (
                  <span aria-hidden className="absolute -bottom-[5px] left-0 right-0 h-px bg-ink" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="z-[60] col-start-3 flex items-center justify-self-end gap-4 sm:gap-6">
          <button
            type="button"
            onClick={() => {
              leave();
              setCartOpen(true);
            }}
            className="link-line min-h-11 font-sans text-[10.5px] uppercase tracking-[0.22em] text-ink"
            aria-label={`Cart, ${slugs.length} ${slugs.length === 1 ? "piece" : "pieces"}`}
          >
            Cart
            {slugs.length > 0 ? (
              <span className="ml-1.5 tabular-nums text-mist">({slugs.length})</span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => {
              setPathWhenOpened(pathname);
              if (open) dismiss();
              else setOpen(true);
            }}
            aria-expanded={open}
            aria-controls="site-menu"
            className="flex min-h-11 min-w-11 items-center justify-end gap-2.5 font-sans text-[10.5px] uppercase tracking-[0.22em] text-ink xl:hidden"
          >
            <span className="hidden sm:inline">{open ? "Close" : "Menu"}</span>
            <span aria-hidden className="relative block h-[10px] w-6">
              <span ref={lineA} className="absolute left-0 top-0 h-px w-full bg-ink" />
              <span ref={lineB} className="absolute bottom-0 left-0 h-px w-full bg-ink" />
            </span>
          </button>
        </div>
      </div>

      <div
        ref={overlay}
        id="site-menu"
        aria-hidden={!open}
        className="invisible fixed inset-0 z-40 bg-ivory opacity-0 xl:hidden"
        inert={!open}
      >
        <div className="flex h-full flex-col justify-between px-5 pb-10 pt-24 sm:px-8 sm:pt-28">
          <ul ref={items} className="space-y-0">
            {site.nav.map((item, i) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={leave}
                    className="flex items-baseline justify-between gap-4 border-b border-line/70 py-4 no-underline sm:py-5"
                  >
                    <span className="flex items-baseline gap-4 sm:gap-6">
                      <span className="font-sans text-[10px] tabular-nums tracking-[0.18em] text-mist">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`font-display text-[clamp(36px,10vw,64px)] font-light leading-none ${
                          active ? "text-ink" : "text-ink/75"
                        }`}
                      >
                        {item.label}
                      </span>
                    </span>
                    <span className="hidden font-jp text-[12px] tracking-[0.2em] text-mist sm:block">{item.ja}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div data-menu-foot className="border-t border-line pt-6">
            <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-mist">{site.location}</p>
            <button
              type="button"
              onClick={() => {
                leave();
                setCartOpen(true);
              }}
              className="mt-4 min-h-11 font-sans text-[12px] uppercase tracking-[0.22em] text-ink"
            >
              Cart · {String(slugs.length).padStart(2, "0")}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
