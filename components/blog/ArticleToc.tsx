"use client";

import { useState } from "react";
import { useGSAP } from "@gsap/react";

import { scrollToChapter } from "@/components/motion/lenis";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { headingId } from "@/lib/heading-id";

type Head = { id: string; text: string };

/**
 * 節が少ない記事には出さない。二つの見出しを一覧にしても、目次は道具にならない。
 */
const MIN_HEADS = 3;

/** 描かれた本文から h2 を拾い、id の無いものには振る。 */
function collectHeads(body: Element): Head[] {
  const taken = new Set<string>();
  const found: Head[] = [];
  body.querySelectorAll("h2").forEach((el) => {
    const text = el.textContent?.trim();
    if (!text) return;
    /* 既に id があるなら尊重する（CMS 側で振られている場合） */
    if (!el.id) el.id = headingId(text, taken);
    else taken.add(el.id);
    found.push({ id: el.id, text });
  });
  return found;
}

/**
 * 記事の目次。**本文の右の余白に立てる。**
 *
 * 行長を 70 文字で止めると（`--blog-measure`）、広い画面では右に 400px 空く。これは穴ではなく
 * 余白で、写真と引用がそこへ食み出す —— ただし写真の無い記事では最後まで空のままになる。
 * 長い記事ならそこは目次が持つのが一番役に立つ。読む前に全体の長さが分かり、途中で
 * 「今どこか」が分かる。トップの `ChapterRail` と同じ考え方・同じ見た目にしてある
 * （現在地の追い方も同じ `useScrollSpy`）。
 *
 * **見出しの収集は DOM から。** 本文は microCMS のリッチエディタ HTML と手書きブロックの
 * 二系統あり、どちらも最終的には同じ `h2` になる。サーバで HTML を書き換えて id を
 * 埋めるより、描かれた後の一箇所で拾うほうが、二系統が食い違わない。
 */
export function ArticleToc() {
  const [heads, setHeads] = useState<Head[]>([]);
  const active = useScrollSpy(
    heads.map((head) => head.id),
    "top 30%",
  );

  /*
    拾うのは描かれた後、塗られる前（useGSAP は layout effect）。useEffect だと
    目次が一拍遅れて現れる。
  */
  useGSAP(() => {
    const body = document.querySelector("[data-article-body]");
    if (!body) return;
    const found = collectHeads(body);
    if (found.length >= MIN_HEADS) setHeads(found);
  }, []);

  if (heads.length === 0) return null;

  return (
    <aside
      /*
        版面（980px）の右端に寄せる。本文は measure で止まっているので重ならない。
        `h-full` の絶対配置が sticky の効く範囲 —— 記事が終われば目次も一緒に流れていく。
        xl 未満では余白そのものが足りないので出さない。
      */
      className="pointer-events-none absolute right-5 top-0 hidden h-full w-[232px] xl:block"
    >
      <nav aria-label="Contents" className="pointer-events-auto sticky top-[120px]">
        <p className="eyebrow">Contents</p>
        <ol className="mt-5 space-y-3.5">
          {heads.map((head, i) => {
            const current = i === active;
            return (
              <li key={head.id}>
                <button
                  type="button"
                  onClick={() => scrollToChapter(head.id)}
                  aria-current={current ? "true" : undefined}
                  className="block w-full text-left outline-none"
                >
                  <span
                    className={`block font-sans text-[11.5px] leading-[1.55] transition-colors duration-500 ease-[var(--ease-soft)] ${
                      current ? "text-ivory" : "text-mist hover:text-bone"
                    }`}
                  >
                    {head.text}
                  </span>
                  {/* 現在地は罫で言う。レールと同じ所作。 */}
                  <span
                    aria-hidden
                    className={`mt-2 block h-px origin-left bg-ivory/50 transition-transform duration-700 ease-[var(--ease-soft)] ${
                      current ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </aside>
  );
}
