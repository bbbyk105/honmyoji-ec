"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "@/components/motion/reduced-motion";
import "@/components/motion/register";

/**
 * カーソルに語を付ける。
 *
 * ただし**全体のカーソルは置き換えない**。DESIGN.md の「装飾は意図的に、稀に」に従って、
 * 語が灯るのは `data-cursor` を持つもの（作品・拡大できる写真）の上だけ。
 * どこでも付いて回る印は、サイトの語彙ではなく作った人の署名になる。
 *
 * 出すのは「押せることが形から読めない」場所に限る —— 作品のカットアウトは
 * 台の上に浮いているだけで、ボタンにもリンクにも見えない。そこに View と出す。
 *
 * **丸い輪にはしない。** この版に円も角丸も一つも無い（ボタンも StatusPill も、
 * 罫と字だけで出来ている）ので、追従する円盤はサイト中でいちばん強い形になってしまう。
 * 印は「マスクから起きる語 + ヘアライン」—— 見出しや CTA と同じ所作の、小さな一語。
 *
 * 細かいポインタ（マウス）で、版面が広いときだけ。触る画面には出さない（指の下は見えない）。
 */
export function CursorMark() {
  const mark = useRef<HTMLDivElement>(null);
  const word = useRef<HTMLSpanElement>(null);
  const line = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const el = mark.current;
    const text = word.current;
    const rule = line.current;
    if (!el || !text || !rule) return;
    if (!window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches) return;
    if (prefersReducedMotion()) return;

    gsap.set(el, { autoAlpha: 0 });
    gsap.set(text, { yPercent: 110 });

    const toX = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3" });
    const toY = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3" });

    let shown = "";

    /*
      重なったぶんだけを取り下げる（`overwrite: "auto"`）。`killTweensOf(el)` で
      まとめて消すと、追従を持っている quickTo のトゥイーンごと死ぬ —— 語は出るのに
      印が画面の左上から動かなくなる（実際に踏んだ）。auto なら同じプロパティだけ
      引き継ぐので、x / y はそのまま生き残る。
    */
    const show = (next: string) => {
      if (next === shown) return;
      shown = next;

      if (next) {
        text.textContent = next;
        gsap.to(el, { autoAlpha: 1, duration: 0.2, overwrite: "auto" });
        gsap.fromTo(
          text,
          { yPercent: 110 },
          { yPercent: 0, duration: 0.55, ease: "power3.out", overwrite: "auto" },
        );
        gsap.fromTo(
          rule,
          { scaleX: 0 },
          { scaleX: 1, duration: 0.6, ease: "power3.out", overwrite: "auto" },
        );
        return;
      }

      gsap.to(el, { autoAlpha: 0, duration: 0.28, ease: "power2.out", overwrite: "auto" });
    };

    /* ポインタの真下に置くと指し示しているものを隠す。右下へ一字ぶん逃がす。 */
    const OFFSET = 18;

    const onMove = (event: PointerEvent) => {
      toX(event.clientX + OFFSET);
      toY(event.clientY + OFFSET);
      const host = (event.target as Element | null)?.closest?.("[data-cursor]") as
        | HTMLElement
        | null;
      show(host?.dataset.cursor ?? "");
    };

    /* 窓の外へ出たら消す。置き去りの語が端に残らないように。 */
    const onLeave = () => show("");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  return (
    <div
      ref={mark}
      aria-hidden
      className="pointer-events-none invisible fixed left-0 top-0 z-[85] hidden lg:block"
    >
      <span className="block overflow-hidden">
        <span
          ref={word}
          className="block whitespace-nowrap font-sans text-[9.5px] uppercase leading-[1.6] tracking-[0.22em] text-ivory"
        />
      </span>
      <span ref={line} className="block h-px w-full origin-left bg-ivory/45" />
    </div>
  );
}
