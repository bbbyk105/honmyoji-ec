import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InquiryCta } from "@/components/cart/HoldButton";
import { PieceSlug } from "@/components/collection/PieceSlug";
import { GalleryStrip } from "@/components/collection/GalleryStrip";
import { ProductHero } from "@/components/collection/ProductHero";
import { StatusPill } from "@/components/collection/StatusPill";
import { StillTile } from "@/components/collection/StillTile";
import { Button } from "@/components/site/Button";
import { Frame } from "@/components/site/Frame";
import { Reveal } from "@/components/site/Reveal";
import {
  LINE_LABEL,
  cm,
  getProduct,
  productImage,
  productPath,
  products,
  usd,
  type Product,
} from "@/data/products";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};
  return {
    title: `${product.name} ${product.kanji} — ${usd.format(product.priceUsd)}`,
    description: `${product.note} ${LINE_LABEL[product.line].en}, ${product.sku}. Handmade at Honmyoji Temple, Fuji.`,
    openGraph: { images: [{ url: productImage(product.slug, 1) }] },
  };
}

function cta(product: Product) {
  const q = `?product=${product.slug}`;
  switch (product.status) {
    case "available":
      return {
        primary: { href: `/contact${q}&subject=reserve`, label: "Reserve this piece" },
        secondary: { href: `/contact${q}&subject=question`, label: "Ask a question" },
        note: "Add it to your cart and send it to us. We reply with a private checkout. Card, via Stripe, when arranged.",
      };
    case "reserved":
      return {
        primary: { href: `/contact${q}&subject=waitlist`, label: "Join the waitlist" },
        secondary: null,
        note: "Someone has asked for this piece. If it is not completed, it returns here — we will write.",
      };
    case "coming_soon":
      return {
        primary: { href: `/contact${q}&subject=notify`, label: "Notify me" },
        secondary: null,
        note: "Finished and photographed. Leave an address; we write the day it is released.",
      };
    case "sold_out":
      return {
        primary: { href: `/contact${q}&subject=custom`, label: "A piece in this spirit" },
        secondary: null,
        note: "This bag has gone. We will not make it again. We can work from a similar height, handle, and colour family.",
      };
  }
}

const GALLERY_RATIO = ["4/5", "1/1", "16/10", "4/5", "1/1"] as const;

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  if (slug !== product.slug) redirect(productPath(product));

  const index = products.findIndex((p) => p.slug === product.slug);
  const related = products.filter((p) => p.slug !== product.slug && p.line === product.line).slice(0, 3);
  const action = cta(product);
  const gallery = Array.from({ length: product.galleryCount }, (_, i) => i + 1);
  const extras = gallery.slice(1);

  return (
    <>
      <section className="pt-16 sm:pt-[72px] md:pt-[80px]">
        <div className="mx-auto grid w-full max-w-[1480px] gap-8 px-4 sm:px-5 md:grid-cols-12 md:gap-10 md:px-8 lg:px-12">
          <div className="md:col-span-6 lg:sticky lg:top-[80px] lg:self-start">
            <ProductHero product={product} />
          </div>

          <div className="flex flex-col justify-center pb-16 pt-2 md:col-span-5 md:col-start-8 md:py-16">
            <Button
              href="/collection"
              variant="link"
              arrow={false}
              className="hero-settle w-fit text-mist hover:text-ink"
            >
              Collection
            </Button>
            <p
              className="eyebrow hero-settle mt-8"
              style={{ "--delay": "60ms" } as React.CSSProperties}
            >
              {LINE_LABEL[product.line].en} · {product.sku}
            </p>
            <h1
              className="hero-settle mt-4 font-display text-[clamp(52px,6.4vw,88px)] font-light leading-[0.94] text-ink"
              style={{ "--delay": "120ms" } as React.CSSProperties}
            >
              {product.name}
            </h1>
            <p
              className="hero-settle mt-3 font-jp text-[15px] tracking-[0.32em] text-charcoal/75"
              style={{ "--delay": "180ms" } as React.CSSProperties}
            >
              {product.kanji}
              <span className="ml-3 text-[11px] tracking-[0.2em] text-mist">{product.reading}</span>
            </p>
            <PieceSlug product={product} className="hero-settle mt-4" />

            <div
              className="hero-settle mt-8 flex flex-wrap items-end gap-4"
              style={{ "--delay": "240ms" } as React.CSSProperties}
            >
              <span className="font-display text-[32px] font-light leading-none text-ink">
                {usd.format(product.priceUsd)}
              </span>
              <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-mist">USD · shipping included</span>
            </div>
            <div className="hero-settle mt-3" style={{ "--delay": "260ms" } as React.CSSProperties}>
              <StatusPill status={product.status} />
            </div>

            <p
              className="hero-settle mt-8 max-w-[40ch] font-display text-[22px] font-light leading-[1.4] text-ink"
              style={{ "--delay": "300ms" } as React.CSSProperties}
            >
              {product.note}
            </p>
            <p
              className="hero-settle mt-5 max-w-[46ch] font-sans text-[14px] leading-[1.9] text-charcoal/85"
              style={{ "--delay": "340ms" } as React.CSSProperties}
            >
              {product.story}
            </p>
            <p
              className="hero-settle mt-4 max-w-[46ch] font-jp text-[12.5px] leading-[2] tracking-[0.04em] text-mist"
              style={{ "--delay": "380ms" } as React.CSSProperties}
            >
              {product.storyJa}
            </p>

            <div
              className="hero-settle mt-10 flex flex-wrap items-center gap-6"
              style={{ "--delay": "420ms" } as React.CSSProperties}
            >
              <InquiryCta
                product={product}
                href={action.primary.href}
                label={action.primary.label}
                variant={product.status === "available" ? "solid" : "outline"}
              />
              {action.secondary ? (
                <Button href={action.secondary.href} variant="outline" arrow={false}>
                  {action.secondary.label}
                </Button>
              ) : null}
            </div>
            <p
              className="hero-settle mt-5 max-w-[46ch] font-sans text-[12px] leading-[1.8] text-mist"
              style={{ "--delay": "460ms" } as React.CSSProperties}
            >
              {action.note}
            </p>
          </div>
        </div>
      </section>

      {/* Specs — quiet documentation */}
      <section className="mx-auto w-full max-w-[1480px] px-5 pt-8 md:px-8 md:pt-12 lg:px-12">
        <Reveal>
          <h2 className="font-sans text-[10.5px] uppercase tracking-[0.26em] text-ink">Specification</h2>
          <dl className="mt-8 grid gap-x-12 gap-y-8 border-t border-line pt-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="eyebrow">Measure</dt>
              <dd className="mt-3 space-y-1.5 font-sans text-[13px] leading-[1.7] text-charcoal/85">
                <p>W {cm(product.size.width)}</p>
                <p>H {cm(product.size.height)}</p>
                <p>D {cm(product.size.depth)}</p>
                <p>Handle drop {cm(product.size.handleDrop)}</p>
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Materials</dt>
              <dd className="mt-3 space-y-1.5 font-sans text-[13px] leading-[1.7] text-charcoal/85">
                {product.materials.map((m) => (
                  <p key={m}>{m}</p>
                ))}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Origin</dt>
              <dd className="mt-3 space-y-1.5 font-sans text-[13px] leading-[1.7] text-charcoal/85">
                <p>Honmyoji Temple, Fuji City, Japan</p>
                <p>Weight — {product.weightG ? `${product.weightG} g` : "noted before shipping"}</p>
                <p>One of a kind · not reprinted</p>
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Care</dt>
              <dd className="mt-3 space-y-1.5 font-sans text-[13px] leading-[1.7] text-charcoal/85">
                <p>Spot clean. No machine.</p>
                <p>Dry, standing or hung.</p>
                <Link href="/journal/holding-the-weave" className="link-line text-ink">
                  Care note
                </Link>
              </dd>
            </div>
          </dl>
        </Reveal>
      </section>

      {/* Image-led documentation */}
      <section className="mx-auto w-full max-w-[1480px] px-5 pt-16 md:px-8 md:pt-24 lg:px-12">
        <Reveal className="mb-6 flex items-baseline justify-between gap-4 md:mb-8">
          <h2 className="font-sans text-[10.5px] uppercase tracking-[0.26em] text-ink">
            {product.name} — views
          </h2>
          <span className="shrink-0 font-sans text-[9.5px] uppercase tracking-[0.2em] text-mist">
            {gallery.length} {gallery.length === 1 ? "view" : "views"}
            {gallery.length > 1 ? <span className="md:hidden"> · swipe</span> : null}
          </span>
        </Reveal>

        {/* スマホは横スワイプ、md 以上は編集的なグリッド */}
        <div className="md:hidden">
          <GalleryStrip
            shots={gallery.map((n) => ({
              src: productImage(product.slug, n),
              alt: `${product.name}, view ${n}`,
              caption: n === 1 ? `${product.name} · still life` : `${product.name} · view ${n}`,
            }))}
          />
        </div>

        <div className="hidden gap-5 md:grid md:grid-cols-12">
          <Reveal className="md:col-span-7">
            <Frame
              src={productImage(product.slug, 1)}
              alt={`${product.name}, still life`}
              role="product-still"
              ratio="4/5"
              sizes="(min-width: 768px) 55vw, 100vw"
            />
          </Reveal>
          <div className="grid gap-5 md:col-span-5">
            {extras.slice(0, 2).map((n, i) => {
              const ratio = GALLERY_RATIO[n] ?? "4/5";
              return (
                <Reveal key={n} delay={i * 70}>
                  <Frame
                    src={productImage(product.slug, n)}
                    alt={`${product.name}, view ${n}`}
                    role={i === 0 ? "product-detail" : "lifestyle"}
                    ratio={ratio}
                    caption={`${product.name} · ${i === 0 ? "detail" : "in place"}`}
                    sizes="(min-width: 768px) 38vw, 100vw"
                  />
                </Reveal>
              );
            })}
          </div>
          {extras.slice(2).map((n, i) => (
            <Reveal key={n} delay={i * 60} className={i === 0 ? "md:col-span-8" : "md:col-span-4"}>
              <Frame
                src={productImage(product.slug, n)}
                alt={`${product.name}, view ${n}`}
                role="product-detail"
                ratio={i === 0 ? "16/10" : "4/5"}
                caption={`${product.name} · ${n}`}
                sizes={i === 0 ? "(min-width: 768px) 66vw, 100vw" : "(min-width: 768px) 32vw, 100vw"}
              />
            </Reveal>
          ))}
        </div>
      </section>

      {related.length > 0 ? (
        <section className="mx-auto w-full max-w-[1480px] px-5 pt-24 md:px-8 md:pt-32 lg:px-12">
          <Reveal>
            <h2 className="font-sans text-[10.5px] uppercase tracking-[0.26em] text-ink">Alongside</h2>
            <p className="mt-3 max-w-[40ch] font-display text-[24px] font-light text-ink">
              Other pieces from the same table, not a recommendation engine.
            </p>
          </Reveal>
          <div className="-mx-5 mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:grid sm:snap-none sm:grid-cols-3 sm:gap-10 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
            {related.map((p) => (
              <div key={p.slug} className="w-[66vw] shrink-0 snap-start sm:w-auto">
                <StillTile product={p} ratio="4/5" />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <nav className="mx-auto mt-20 w-full max-w-[1480px] border-t border-line px-5 md:px-8 lg:px-12">
        <div className="grid grid-cols-2">
          <Link
            href={productPath(products[(index - 1 + products.length) % products.length])}
            className="group border-r border-line py-10 pr-5 no-underline"
          >
            <span className="font-sans text-[9.5px] uppercase tracking-[0.24em] text-mist">Previous</span>
            <span className="mt-3 block font-display text-[26px] font-light leading-none text-ink">
              {products[(index - 1 + products.length) % products.length].name}
            </span>
          </Link>
          <Link
            href={productPath(products[(index + 1) % products.length])}
            className="group py-10 pl-5 text-right no-underline"
          >
            <span className="font-sans text-[9.5px] uppercase tracking-[0.24em] text-mist">Next</span>
            <span className="mt-3 block font-display text-[26px] font-light leading-none text-ink">
              {products[(index + 1) % products.length].name}
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
}
