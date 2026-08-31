import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/site/Button";
import { Frame } from "@/components/site/Frame";
import { Reveal } from "@/components/site/Reveal";
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
 */
export function BlogArticle({ entry, next }: Props) {
  const hasImage = Boolean(entry.image);

  return (
    <article className="pt-16 sm:pt-[72px] md:pt-[80px]">
      <header className="mx-auto w-full max-w-[980px] px-5 pt-12 sm:pt-14 md:pt-20">
        <Button href="/blog" variant="link" arrow={false} className="text-mist hover:text-ink">
          Blog
        </Button>
        <p className="eyebrow mt-10">{blogMeta(entry.topic, entry.season)}</p>
        <h1 className="mt-4 max-w-[22ch] font-display text-[clamp(38px,5.2vw,68px)] font-light leading-[1.02] text-ink">
          {entry.title}
        </h1>
        {entry.titleJa ? (
          <p className="mt-4 font-jp text-[14px] tracking-[0.22em] text-mist">{entry.titleJa}</p>
        ) : null}
        {entry.dek ? (
          <p className="mt-8 max-w-[42ch] font-display text-[clamp(20px,2.1vw,25px)] font-light leading-[1.45] text-charcoal">
            {entry.dek}
          </p>
        ) : null}
        <p
          className={`mt-8 font-sans text-[11px] uppercase tracking-[0.18em] text-mist ${
            hasImage ? "border-t border-line pt-5" : ""
          }`}
        >
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

      {/* 写真があるときは写真の下、無いときは日付の下で本文を始める。空の井戸は出さない。 */}
      <div
        className={`mx-auto w-full max-w-[980px] px-5 ${
          hasImage ? "mt-16" : "mt-12 border-t border-line pt-12"
        }`}
      >
        {entry.pull ? (
          <Reveal>
            <p className="mb-16 max-w-[28ch] font-display text-[clamp(28px,3.4vw,40px)] font-light italic leading-[1.28] text-ink md:mb-20">
              {entry.pull}
            </p>
          </Reveal>
        ) : null}

        <div className="space-y-7">
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
                  <h2 className="pt-10 font-display text-[clamp(24px,2.6vw,31px)] font-light leading-[1.2] text-ink">
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
                      className={`relative overflow-hidden bg-parchment ${
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
                    <figcaption className="mt-3 font-sans text-[10px] uppercase tracking-[0.2em] text-mist">
                      {block.caption}
                    </figcaption>
                  </figure>
                </Reveal>
              );
            }
            if (block.type === "p" && block.text) {
              return (
                <Reveal key={i}>
                  <p className="font-sans text-[17px] leading-[1.9] text-charcoal">{block.text}</p>
                </Reveal>
              );
            }
            return null;
          })}
        </div>
      </div>

      {next ? (
        <footer className="mx-auto mt-24 w-full max-w-[980px] px-5">
          <Link
            href={`/blog/${next.slug}`}
            className="group flex items-end justify-between gap-8 border-t border-line py-10 no-underline"
          >
            <span>
              <span className="block font-sans text-[10px] uppercase tracking-[0.24em] text-mist">Next note</span>
              <span className="mt-3 block font-display text-[clamp(26px,3.2vw,38px)] font-light leading-[1.15] text-ink">
                {next.title}
              </span>
              {next.dek ? (
                <span className="mt-2 block max-w-[46ch] font-sans text-[13.5px] leading-[1.7] text-charcoal/75">
                  {next.dek}
                </span>
              ) : null}
            </span>
            <span
              aria-hidden
              className="shrink-0 pb-1 font-sans text-[17px] text-mist transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5 group-hover:text-ink"
            >
              →
            </span>
          </Link>
        </footer>
      ) : (
        <div className="mt-24" />
      )}
    </article>
  );
}
