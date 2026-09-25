import { Button } from "@/components/site/Button";
import { SHELL } from "@/components/site/Shell";
import { SiteChrome } from "@/components/site/SiteChrome";

/**
 * どのセグメントにも当たらない URL はルートの not-found で描かれる — (site) の
 * layout は通らないので、外枠は自分で被せる。
 */
export default function NotFound() {
  return (
    <SiteChrome>
      <section className={`${SHELL} flex min-h-[78vh] flex-col justify-center pb-beat pt-[120px]`}>
        <h1 className="max-w-[14ch] font-display text-display font-light text-ivory">This page has gone.</h1>
        <p lang="ja" className="mt-5 font-jp text-[15px] tracking-[0.06em] text-mist">ページが見つかりません</p>
        <Button href="/collection" className="mt-10 w-fit">
          The collection
        </Button>
      </section>
    </SiteChrome>
  );
}
