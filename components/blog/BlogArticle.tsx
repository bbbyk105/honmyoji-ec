import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/site/Button";
import { Frame } from "@/components/site/Frame";
import { Arrow } from "@/components/site/Arrow";
import { Reveal } from "@/components/site/Reveal";
import { ArticleToc } from "./ArticleToc";
import { formatBlogDate, blogMeta, type BlogPost } from "@/data/blog";

type Props = {
  entry: BlogPost;
  /** 記事末尾の「次の一本」。プレビューでは付けない。 */
  next?: BlogPost;
};

/**
 * 記事の組み。`/blog/[slug]`（公開）と `/blog/preview`（下書き）で共有する。
 * 見出しも本文も同じ左端に揃える — 読み始めるたびに視線が横に飛ばないように。
 * サムネは任意。無いときはプレースホルダを出さず、本文までの余白だけ詰める。
 *
 * **版面（980px）と行長（`--blog-measure`）は別物。** 文章は measure で止め、写真だけが
 * 版面いっぱいに出る。両方を 980px にすると 1 行が 119 文字になり、折り返すたびに
 * 目が左端を見失う（実測して直した）。右に空くのは穴ではなく、写真が食み出すための余白。
 */

/** 文章の列。写真・引用はこれを使わず版面いっぱいに出る。 */
const MEASURE = "max-w-[var(--blog-measure)]";

export function BlogArticle({ entry, next }: Props) {
  const hasImage = Boolean(entry.image);

  return (
    /* 記事は紙の面。長い文章は紙の上のほうが目が疲れない（一覧と同じ紙を繰る）。 */
    <article className="surface-paper pb-beat pt-16 sm:pt-[72px] md:pt-[80px]">
      <header className="mx-auto w-full max-w-[980px] px-5 pt-12 sm:pt-14 md:pt-20">
        <Button href="/blog" arrow={false} className="text-mist hover:text-ivory">
          Blog
        </Button>
        <p className="eyebrow mt-12">{blogMeta(entry.topic, entry.season)}</p>
        <h1 className="mt-5 max-w-[20ch] font-display text-[clamp(40px,4.4vw+8px,76px)] font-light leading-[1.02] tracking-[-0.022em] text-ivory">
          {entry.title}
        </h1>
        {entry.titleJa ? (
          <p lang="ja" className="mt-5 font-jp text-[15px] tracking-[0.06em] text-mist">{entry.titleJa}</p>
        ) : null}
        {entry.dek ? (
          <p className="mt-9 max-w-[40ch] font-display text-deck font-light text-bone">{entry.dek}</p>
        ) : null}
        <p className={`mt-9 font-sans text-meta text-mist ${hasImage ? "border-t border-line pt-5" : ""}`}>
          {formatBlogDate(entry.date)}
        </p>
        {hasImage ? (
          <div className="mt-10">
            <Frame
              src={entry.image}
              alt={entry.imageAlt}
              role={entry.imageRole}
              ratio="16/10"
              caption={entry.imageAlt}
              priority
              sizes="(min-width: 980px) 980px, 100vw"
            />
          </div>
        ) : null}
      </header>

      {/*
        写真があるときは写真の下、無いときは日付の下で本文を始める。空の井戸は出さない。
        `relative` は目次のため —— 目次は版面の右端に絶対配置で立つ（本文は measure で
        止まっているので重ならない）。`data-article-body` は目次が見出しを拾う目印。
      */}
      <div
        data-article-body
        className={`relative mx-auto w-full max-w-[980px] px-5 ${
          hasImage ? "mt-16" : "mt-12 border-t border-line pt-12"
        }`}
      >
        <ArticleToc />
        {entry.pull ? (
          <Reveal>
            <p className="mb-16 max-w-[26ch] font-display text-[clamp(28px,1.6vw+14px,40px)] font-light leading-[1.3] tracking-[-0.012em] text-ivory md:mb-20">
              {entry.pull}
            </p>
          </Reveal>
        ) : null}

        {/* 段落の間は行間（32.3px）より広く。space-y-7（28px）だと段落の切れ目が読めない。 */}
        <div className="space-y-9">
          {entry.body.map((block, i) => {
            if (block.type === "html" && block.html) {
              /* microCMS のリッチエディタ。組みは globals.css の .blog-prose。 */
              return (
                <Reveal key={i}>
                  <div className="blog-prose" dangerouslySetInnerHTML={{ __html: block.html }} />
                </Reveal>
              );
            }
            if (block.type === "h" && block.text) {
              return (
                <Reveal key={i}>
                  {/* 上は離し、下は詰める（`space-y` を打ち消す `-mb-2`）。見出しは次に来る文章の持ち物。 */}
                  <h2
                    className={`${MEASURE} -mb-2 pt-10 font-display text-title font-light text-ivory`}
                  >
                    {block.text}
                  </h2>
                </Reveal>
              );
            }
            if (block.type === "image" && block.src) {
              return (
                <Reveal key={i} className="py-8">
                  <figure>
                    <div
                      className={`relative overflow-hidden bg-sumi ${
                        block.ratio === "16/10"
                          ? "aspect-[16/10]"
                          : block.ratio === "1/1"
                            ? "aspect-square"
                            : "aspect-[3/4]"
                      }`}
                    >
                      <Image
                        src={block.src}
                        alt={block.alt ?? ""}
                        fill
                        sizes="(min-width: 980px) 980px, 100vw"
                        className="object-cover"
                      />
                    </div>
                    <figcaption className="mt-3 font-sans text-meta text-mist">
                      {block.caption}
                    </figcaption>
                  </figure>
                </Reveal>
              );
            }
            if (block.type === "p" && block.text) {
              return (
                <Reveal key={i}>
                  <p className={`${MEASURE} font-sans text-body leading-[1.85] text-bone`}>
                    {block.text}
                  </p>
                </Reveal>
              );
            }
            return null;
          })}
        </div>
      </div>

      {next ? (
        <footer className="mx-auto mt-pause w-full max-w-[980px] px-5">
          <Link
            href={`/blog/${next.slug}`}
            className="group flex items-end justify-between gap-8 border-t border-line py-10 no-underline"
          >
            <span>
              <span className="block font-sans text-meta text-mist">Next note</span>
              <span className="mt-3 block font-display text-title font-light text-ivory">{next.title}</span>
              {next.dek ? (
                <span className="mt-3 block max-w-[46ch] font-sans text-small text-bone">{next.dek}</span>
              ) : null}
            </span>
            <span className="shrink-0 pb-2 text-mist transition-colors duration-500 group-hover:text-ivory">
              <Arrow className="cta-arrow" />
            </span>
          </Link>
        </footer>
      ) : null}
    </article>
  );
}
