import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InquiryCta } from "@/components/cart/InquiryCta";
import { GalleryStrip } from "@/components/collection/GalleryStrip";
import { LightboxProvider, Zoomable } from "@/components/collection/Lightbox";
import { PieceTile } from "@/components/collection/PieceTile";
import { ProductHero } from "@/components/collection/ProductHero";
import { StatusPill } from "@/components/collection/StatusPill";
import { Button } from "@/components/site/Button";
import { Frame } from "@/components/site/Frame";
import { Reveal } from "@/components/site/Reveal";
import { SHELL } from "@/components/site/Shell";
import { SwipeStrip } from "@/components/site/SwipeStrip";
import { imageSize } from "@/data/image-sizes";
import { blogHref } from "@/lib/microcms";
import { getCatalog, getPiece } from "@/lib/catalog";
import {
  LINE_LABEL,
  LINE_RATIO,
  cm,
  isPurchasable,
  priceLabel,
  productImage,
  productPath,
  products,
  type Product,
} from "@/data/products";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPiece(slug);
  if (!product) return {};
  const price = priceLabel(product);
  return {
    title: `${product.name} ${product.kanji}${price ? ` — ${price}` : ""}`,
    description: `${product.note} ${LINE_LABEL[product.line].en}, ${product.sku}. Handmade at Honmyoji Temple, Fuji.`,
    openGraph: { images: [{ url: productImage(product.slug, 1) }] },
  };
}

function cta(product: Product) {
  const q = `?product=${product.slug}`;
  switch (product.status) {
    case "available":
      /* 管理画面で Available にしても、値段が入っていなければカートには入らない（`isPurchasable`）。 */
      return isPurchasable(product)
        ? {
            primary: { href: `/contact${q}&subject=reserve`, label: "Reserve this piece" },
            secondary: { href: `/contact${q}&subject=question`, label: "Ask a question" },
            note: "Add it to your cart and send it to us. We reply with a private checkout link, and you pay by card through Stripe.",
          }
        : {
            primary: { href: `/contact${q}&subject=question`, label: "Ask about this piece" },
            secondary: null,
            note: "The price for this piece is being set. Write to us and we reply with it.",
          };
    case "reserved":
      return {
        primary: { href: `/contact${q}&subject=waitlist`, label: "Join the waitlist" },
        secondary: null,
        note: "Someone has already asked for this piece. If the payment is not completed, it comes back here — and we will write to you.",
      };
    case "coming_soon":
      return {
        primary: { href: `/contact${q}&subject=notify`, label: "Notify me" },
        secondary: { href: `/contact${q}&subject=question`, label: "Ask a question" },
        note: "Finished and photographed, not yet released. Leave your email and we write the day it goes on sale, with the price.",
      };
    case "made_to_order":
      return {
        primary: { href: `/contact${q}&subject=colour`, label: "Order in another colour" },
        secondary: { href: `/contact${q}&subject=question`, label: "Ask a question" },
        note: "The piece in the photograph is finished, but this bag is made again to order. Tell us the colours you have in mind — we send photographs of what we hold, then a private checkout link.",
      };
    case "sold_out":
      return {
        primary: { href: `/contact${q}&subject=custom`, label: "A piece in this spirit" },
        secondary: null,
        note: "This piece has gone, and it will not be made again. We can make you a new one in a similar size, shape and family of colours.",
      };
  }
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const product = await getPiece(slug);
  if (!product) notFound();
  if (slug !== product.slug) redirect(productPath(product));

  const catalog = await getCatalog();
  const index = catalog.findIndex((p) => p.slug === product.slug);
  const prev = catalog[(index - 1 + catalog.length) % catalog.length];
  const next = catalog[(index + 1) % catalog.length];
  const related = catalog.filter((p) => p.slug !== product.slug && p.line === product.line).slice(0, 4);
  /* お手入れの記事へ。記事は microCMS 側で入れ替わるので slug を焼き込まない。 */
  const careHref = await blogHref("holding-the-weave", "Care");
  const action = cta(product);
  const price = priceLabel(product);

  /* 拡大表示の通し番号は一本。0 番がヒーロー（1.webp）、1 番から下のギャラリー。 */
  const photos = Array.from({ length: product.galleryCount }, (_, i) => {
    const src = productImage(product.slug, i + 1);
    return { src, alt: `${product.name}, photograph ${i + 1} of ${product.galleryCount}`, caption: product.name };
  });
  const extras = photos.slice(1);
  const kind = [LINE_LABEL[product.line].en, product.bottleSize].filter(Boolean).join(" · ");
  const tall = LINE_RATIO[product.line] === "4/5";

  /*
    商品ページも紙の面（一覧と同じ部屋）。一覧の写真がそのままヒーローへモーフするので、
    地の色が途中で変わると像より地の入れ替わりのほうが目立つ。拡大表示（Lightbox）も
    この面の中に開くので、同じ紙の上で見る（一枚だけ別の明るさの部屋に持っていかない）。
  */
  return (
    <LightboxProvider shots={photos}>
      <div className="surface-paper pb-beat">
      <section className="pt-16 sm:pt-[72px] md:pt-[80px]">
        <div className={`${SHELL} grid gap-10 pt-6 md:grid-cols-12 md:gap-10 md:pt-10`}>
          {/*
            縦長（4:5）のヒーローは画面の高さで幅が決まる（1440×900 で 617px）ので、7 段に置くと
            写真と本文の間に 190px の穴が空いた。縦長は写真 6 段・本文 7 段目から、横長（3:2）は
            写真 7 段・本文 9 段目から —— どちらも写真の右端から本文までがおよそ一段ぶんになる。
          */}
          <div className={`md:col-span-7 lg:sticky lg:top-[104px] lg:self-start ${tall ? "lg:col-span-6" : ""}`}>
            <ProductHero product={product} />
          </div>

          <div
            className={`flex flex-col pb-4 md:col-span-5 md:py-6 ${
              tall ? "lg:col-span-6 lg:col-start-7" : "lg:col-span-4 lg:col-start-9"
            }`}
          >
            <Button
              href="/collection"
              variant="link"
              arrow={false}
              morph
              className="hero-settle w-fit text-mist hover:text-ivory"
            >
              Collection
            </Button>

            <p
              className="hero-settle mt-12 font-sans text-meta text-mist"
              style={{ "--delay": "60ms" } as React.CSSProperties}
            >
              {kind}
            </p>
            <h1
              className="hero-settle mt-4 font-display text-display font-light text-ivory"
              style={{ "--delay": "120ms" } as React.CSSProperties}
            >
              {product.name}
            </h1>
            <p
              lang="ja"
              className="hero-settle mt-4 font-jp text-[16px] tracking-[0.06em] text-bone"
              style={{ "--delay": "180ms" } as React.CSSProperties}
            >
              {product.kanji}
              <span className="ml-3 font-sans text-meta tracking-normal text-mist">{product.reading}</span>
            </p>

            <div
              className="hero-settle mt-10 flex items-baseline gap-4 border-t border-line pt-6"
              style={{ "--delay": "240ms" } as React.CSSProperties}
            >
              {price ? (
                <>
                  <span className="font-display text-[32px] font-light leading-none tabular-nums text-ivory">{price}</span>
                  <span className="font-sans text-meta text-mist">Shipping included</span>
                </>
              ) : null}
              <StatusPill status={product.status} className={price ? "ml-auto" : ""} />
            </div>

            <p
              className="hero-settle mt-10 max-w-[30ch] font-display text-deck font-light text-ivory"
              style={{ "--delay": "300ms" } as React.CSSProperties}
            >
              {product.note}
            </p>
            <p
              className="hero-settle mt-6 max-w-[44ch] font-sans text-body text-bone"
              style={{ "--delay": "340ms" } as React.CSSProperties}
            >
              {product.story}
            </p>
            <p
              lang="ja"
              className="hero-settle mt-5 max-w-[28em] font-jp text-[14px] leading-[2] text-mist"
              style={{ "--delay": "380ms" } as React.CSSProperties}
            >
              {product.storyJa}
            </p>

            {/*
              塗りの四角は「買う・知らせてもらう」の一つだけ。二つ目は語と罫の導線にする —— 同じ重さの
              四角が二つ並ぶと、どちらを押せばいいのかを読む人に選ばせることになる。
              もう手に入らないもの（完売・取り置き中）は、主の導線も語と罫に下げる。
            */}
            <div
              className="hero-settle mt-11 flex flex-wrap items-center gap-x-10 gap-y-5"
              style={{ "--delay": "420ms" } as React.CSSProperties}
            >
              <InquiryCta
                product={product}
                href={action.primary.href}
                label={action.primary.label}
                variant={product.status === "sold_out" || product.status === "reserved" ? "link" : "solid"}
              />
              {action.secondary ? <Button href={action.secondary.href}>{action.secondary.label}</Button> : null}
            </div>
            <p
              className="hero-settle mt-6 max-w-[46ch] font-sans text-meta text-mist"
              style={{ "--delay": "460ms" } as React.CSSProperties}
            >
              {action.note}
            </p>

            {/*
              仕様は本文と同じ列に。以前は下に四段の「SPECIFICATION」を一行ぶち抜きで組んでいたが、
              一行 4 項目・各 3 行の表は写真の下で読まれず、見出しの大文字だけが目立っていた。
            */}
            <dl
              className="hero-settle mt-14 divide-y divide-line border-y border-line font-sans text-small"
              style={{ "--delay": "500ms" } as React.CSSProperties}
            >
              <div className="grid grid-cols-[104px_1fr] gap-4 py-5">
                <dt className="text-mist">Size</dt>
                <dd className="text-bone">
                  {product.size ? (
                    <>
                      <p>W {cm(product.size.width)}</p>
                      <p>H {cm(product.size.height)}</p>
                      <p>D {cm(product.size.depth)}</p>
                      <p>Handle drop {cm(product.size.handleDrop)}</p>
                    </>
                  ) : (
                    <p>
                      {product.bottleSize ? `${product.bottleSize}. ` : ""}Measured and sent to you before
                      shipping.
                    </p>
                  )}
                </dd>
              </div>
              <div className="grid grid-cols-[104px_1fr] gap-4 py-5">
                <dt className="text-mist">Materials</dt>
                <dd className="space-y-1 text-bone">
                  {product.materials.map((m) => (
                    <p key={m}>{m}</p>
                  ))}
                </dd>
              </div>
              <div className="grid grid-cols-[104px_1fr] gap-4 py-5">
                <dt className="text-mist">Made</dt>
                <dd className="space-y-1 text-bone">
                  <p>By hand at Honmyoji Temple, Fuji City</p>
                  {/* 受注生産だけは「二度と作らない」が嘘になる（色を変えて作り直せる） */}
                  <p>{product.status === "made_to_order" ? "Made to order, no two the same" : "One of a kind, never remade"}</p>
                </dd>
              </div>
              <div className="grid grid-cols-[104px_1fr] gap-4 py-5">
                <dt className="text-mist">Care</dt>
                <dd className="space-y-1 text-bone">
                  <p>Spot clean only. Dry it standing or hanging.</p>
                  <Link href={careHref} className="link-line text-ivory">
                    Care note
                  </Link>
                </dd>
              </div>
              <div className="grid grid-cols-[104px_1fr] gap-4 py-5">
                <dt className="text-mist">Ref.</dt>
                <dd className="font-sans tabular-nums text-bone">{product.sku}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {extras.length > 0 ? (
        <section className={`${SHELL} pt-breath`}>
          {/*
            スマホは横スワイプ（一画面一枚）。md 以上は**撮ったままの比率**で二段に流す。
            縦位置（5:8）と横位置（8:5）が混ざるので、決まった比率の枠に押し込むと持ち手か床が
            切れ、行で組むと縦が一枚余ったときに半分が空く。段組みなら高さの違いを段が吸う。
            一枚だけのときは段にせず中央に置く（片側だけ埋まった二段は、組み損ねに見える）。
          */}
          <div className="md:hidden">
            <GalleryStrip shots={extras} offset={1} />
          </div>
          <div className={`hidden md:block ${extras.length > 1 ? "columns-2 gap-8" : ""}`}>
            {extras.map((shot, i) => {
              const size = imageSize(shot.src);
              const wide = size ? size.width > size.height : false;
              const lone = extras.length === 1 ? (wide ? "mx-auto max-w-[66%]" : "mx-auto max-w-[44%]") : "";
              return (
                <div key={shot.src} className={`mb-8 break-inside-avoid ${lone}`}>
                  <Zoomable index={i + 1}>
                    <Frame
                      src={shot.src}
                      alt={shot.alt}
                      role={wide ? "lifestyle" : "product-detail"}
                      ratio={wide ? "16/10" : "4/5"}
                      aspect={size ? size.width / size.height : undefined}
                      from={i % 2 === 0 ? "left" : "right"}
                      revealDelay={i % 2 === 1 ? 110 : 0}
                      sizes="(min-width: 768px) 46vw, 100vw"
                    />
                  </Zoomable>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className={`${SHELL} pt-pause`}>
          <Reveal className="flex items-end justify-between gap-6 border-t border-line pt-8">
            <h2 className="font-display text-title font-light text-ivory">
              More {LINE_LABEL[product.line].plural.toLowerCase()}
            </h2>
            <Button href={`/collection#${product.line}`} className="shrink-0">
              See all
            </Button>
          </Reveal>
          <SwipeStrip
            className="mt-12"
            trackClassName={`-mx-4 sm:mx-0 sm:grid sm:snap-none sm:gap-6 sm:overflow-visible md:gap-8 ${
              LINE_RATIO[product.line] === "4/5" ? "sm:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {related.map((p) => (
              <PieceTile key={p.slug} product={p} reveal="none" sizes="(min-width: 640px) 25vw, 80vw" />
            ))}
          </SwipeStrip>
        </section>
      ) : null}

      <nav className={`${SHELL} mt-pause`}>
        <div className="grid grid-cols-2 border-y border-line">
          <Link href={productPath(prev)} className="group py-10 pr-5 no-underline md:py-12">
            <span className="font-sans text-meta text-mist transition-colors duration-500 group-hover:text-ivory">Previous</span>
            <span className="mt-3 block font-display text-title font-light text-ivory">{prev.name}</span>
          </Link>
          <Link href={productPath(next)} className="group border-l border-line py-10 pl-5 text-right no-underline md:py-12">
            <span className="font-sans text-meta text-mist transition-colors duration-500 group-hover:text-ivory">Next</span>
            <span className="mt-3 block font-display text-title font-light text-ivory">{next.name}</span>
          </Link>
        </div>
      </nav>
      </div>
    </LightboxProvider>
  );
}
