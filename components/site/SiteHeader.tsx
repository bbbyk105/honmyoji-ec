"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useCart } from "@/components/cart/CartProvider";
import { scrollToChapter } from "@/components/motion/lenis";
import { prefersReducedMotion } from "@/components/motion/reduced-motion";
import { site } from "@/data/site";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useSurfaceAt } from "@/hooks/useSurfaceAt";
import { useWindowEvent } from "@/hooks/useWindowEvent";
import { twoDigits } from "@/lib/format";
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
  /**
   * ヒーローの写真に重なっている間だけ、スクロールしても帯を敷かない。
   * 地は全ページ sumi なので文字の色は動かさない（以前は ivory / ink を切り替えていた）。
   * 判定は DOM の [data-dark-hero] の高さ — ページ側がヒーローを置いたときだけ効く。
   * 初期値はパスから決める。最初の描画は必ず先頭なので、effect を待たずに正しく出る。
   */
  const [onDarkHero, setOnDarkHero] = useState(pathname === "/");
  /*
    下を流れている面が紙かどうか。ヘッダーの帯の中ほど（40px）で読む。紙の上では字を墨に、
    帯も紙の色にする —— 生成りの字のまま紙に乗ると消える（2026-09-25 に面を二つにした）。
  */
  const onPaper = useSurfaceAt(40, pathname);
  const { slugs, setOpen: setCartOpen } = useCart();
  const root = useRef<HTMLElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const items = useRef<HTMLUListElement>(null);
  const lineA = useRef<HTMLSpanElement>(null);
  const lineB = useRef<HTMLSpanElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const hero = document.querySelector<HTMLElement>("[data-dark-hero]");
    const read = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      // ヘッダーの下端が写真を抜けた瞬間に、帯（sumi/92 + 罫）が敷かれる。
      setOnDarkHero(!!hero && y < hero.offsetHeight - 88);
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [pathname]);

  if (pathname !== pathWhenOpened) {
    setPathWhenOpened(pathname);
    setCloseMode("instant");
    setOpen(false);
    // 遷移直後の一フレームだけ前のページの色が残るのを防ぐ（effect は描画後に走る）
    setOnDarkHero(pathname === "/");
  }

  useWindowEvent("keydown", (e) => {
    if (e.key !== "Escape") return;
    setCloseMode("reverse");
    setOpen(false);
  });

  /* 開いている間は背後を止める。数えて止めるので、カートが同時に止めていても外さない。 */
  useScrollLock(open);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const onWide = () => {
      if (!mq.matches) return;
      // 幅で消えるときに巻き戻しを見せる相手はいない
      setCloseMode("instant");
      setOpen(false);
    };
    mq.addEventListener("change", onWide);
    return () => mq.removeEventListener("change", onWide);
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
      const reduced = prefersReducedMotion();
      if (open) {
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
    // closeMode だけ変わる）に閉じる側の所作が再実行される。値は同じコミットで確定するので読めている。
    // （以前はここでスクロールも外していて、MiniCart の stopLenis / body overflow を打ち消していた。
    //  いまは `useScrollLock` が数えて止めるので、その事故は構造的に起きない。）
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

  /**
   * ワードマーク。トップにいるときは URL が変わらず何も起きないので、先頭へ送る。
   * 他のページからは普通に `/` へ遷移する（先頭に置くのは `SmoothScroll`）。
   * 新しいタブで開く操作（⌘ / Ctrl / Shift / 中クリック）は奪わない。
   */
  const onWordmark = (e: MouseEvent<HTMLAnchorElement>) => {
    const wasOpen = open;
    leave();
    if (pathname !== "/" || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    // メニューが開いていたら、ロックが外れてから送る。Lenis の start() は走っている送りを止める。
    if (wasOpen) requestAnimationFrame(() => scrollToChapter(null));
    else scrollToChapter(null);
  };

  /*
    帯を敷くかどうか。ヒーローの写真の上では敷かない —— 第一画面に横線が一本入って見える。
    メニューが開いている間も要らない（面が全部覆う）。

    **帯は不透明。** 以前は 92% だったが、記事の引用（40px の ivory）がその 8% を通して
    読めてしまい、ナビの語と重なって両方読めなくなっていた（実際に踏んだ）。
    地と同じ色なので「板を貼った」には見えない。ぼかし（backdrop-blur）は使わない。
  */
  const overHero = onDarkHero && !open;
  const tone = onPaper && !open ? "tone-paper" : "";
  /* 測る前は data-tone を付けない —— そのあいだは CSS が先頭の節の面で決める（`useSurfaceAt` の註） */
  const measured = onPaper === null ? undefined : onPaper && !open ? "paper" : "dark";

  return (
    <header
      ref={root}
      data-surface-follow
      data-tone={measured}
      style={{ viewTransitionName: "site-header" }}
      className={`fixed inset-x-0 top-0 z-50 text-ivory transition-[background-color,border-color] duration-500 ${tone} ${
        scrolled && !open && !overHero
          ? "border-b border-line bg-sumi"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      {/* 三分割グリッド。flex + justify-between だと nav が中途半端な位置に落ちる */}
      <div className={`${SHELL} grid h-16 grid-cols-[1fr_auto_1fr] items-center sm:h-[72px] md:h-[80px]`}>
        {/*
          ワードマーク。Prompt Light（`font-mark`）—— 見出しの Poppins と同じ幾何学の骨格で、
          銘だけ別の書体にして見出しの断片に見えないようにする。字間は 0.24em、
          添え書きは大文字 11px・0.16em で、二行の幅がほぼ揃う（銘板の組み）。
          右に余る字間（最後の U の後ろの 0.24em）は負の margin で戻して、左右の端を字面で揃える。
        */}
        <Link
          href="/"
          onClick={onWordmark}
          className="z-[60] col-start-1 justify-self-start no-underline"
          aria-label={`${site.name} — home`}
        >
          <span className="mr-[-0.24em] block font-mark text-[21px] font-light leading-none tracking-[0.24em] text-ivory transition-colors duration-500 sm:text-[23px]">
            MIROKU
          </span>
          <span className="mt-[9px] hidden font-sans text-[11px] font-medium uppercase leading-none tracking-[0.16em] text-mist transition-colors duration-500 sm:block">
            Honmyoji · Fuji
          </span>
        </Link>

        <nav aria-label="Primary" className="col-start-2 hidden justify-self-center xl:flex xl:items-center xl:gap-11">
          {site.nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`caps relative py-2 transition-colors duration-500 ${
                  active ? "text-ivory" : "link-line text-bone hover:text-ivory"
                }`}
              >
                {item.label}
                {active ? (
                  <span
                    aria-hidden
                    className="absolute bottom-[3px] left-0 right-0 h-px bg-ivory"
                  />
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
            className="caps link-line min-h-11 text-ivory transition-colors duration-500"
            aria-label={`Cart, ${slugs.length} ${slugs.length === 1 ? "piece" : "pieces"}`}
          >
            Cart
            {slugs.length > 0 ? (
              <span className="ml-1.5 tabular-nums tracking-[0.04em] text-mist">
                ({slugs.length})
              </span>
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
            className="caps flex min-h-11 min-w-11 items-center justify-end gap-3 text-ivory transition-colors duration-500 xl:hidden"
          >
            <span className="hidden sm:inline">{open ? "Close" : "Menu"}</span>
            <span aria-hidden className="relative block h-[10px] w-6">
              <span
                ref={lineA}
                className="absolute left-0 top-0 h-px w-full bg-ivory"
              />
              <span
                ref={lineB}
                className="absolute bottom-0 left-0 h-px w-full bg-ivory"
              />
            </span>
          </button>
        </div>
      </div>

      <div
        ref={overlay}
        id="site-menu"
        aria-hidden={!open}
        className="surface-dark invisible fixed inset-0 z-40 opacity-0 xl:hidden"
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
                      <span className="font-sans text-[12px] tabular-nums text-mist">
                        {twoDigits(i + 1)}
                      </span>
                      <span
                        className={`font-display text-[clamp(36px,10vw,64px)] font-light leading-none ${
                          active ? "text-ivory" : "text-ivory/75"
                        }`}
                      >
                        {item.label}
                      </span>
                    </span>
                    <span className="hidden font-jp text-[13px] tracking-[0.08em] text-mist sm:block">{item.ja}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div data-menu-foot className="border-t border-line pt-6">
            <p className="font-sans text-meta text-mist">{site.location}</p>
            <button
              type="button"
              onClick={() => {
                leave();
                setCartOpen(true);
              }}
              className="caps mt-4 min-h-11 text-ivory"
            >
              Cart{slugs.length > 0 ? ` (${slugs.length})` : ""}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
