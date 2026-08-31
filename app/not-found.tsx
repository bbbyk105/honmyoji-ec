import { Button } from "@/components/site/Button";
import { SiteChrome } from "@/components/site/SiteChrome";

/**
 * どのセグメントにも当たらない URL はルートの not-found で描かれる — (site) の
 * layout は通らないので、外枠は自分で被せる。
 */
export default function NotFound() {
  return (
    <SiteChrome>
      <section className="flex min-h-[70vh] flex-col justify-center px-5 pt-[80px] md:px-12">
        <p className="eyebrow">404</p>
        <h1 className="mt-6 max-w-[16ch] font-display text-[clamp(40px,5.4vw,68px)] font-light leading-[1.02] text-ink">
          This page has gone.
        </h1>
        <p className="mt-4 font-jp text-[12px] tracking-[0.24em] text-mist">ページが見つかりません</p>
        <div className="mt-10">
          <Button href="/collection" variant="link">
            The collection
          </Button>
        </div>
      </section>
    </SiteChrome>
  );
}
