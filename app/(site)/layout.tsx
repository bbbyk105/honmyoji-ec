import type { ReactNode } from "react";

import { SiteChrome } from "@/components/site/SiteChrome";

/**
 * 10 分。管理画面で保存すると revalidatePath がその場で作り直すので、これは
 * 取りこぼしたときの保険。短くしても DB を余計に叩くだけで、値が変わるのは
 * 人が保存した瞬間だけ。
 */
export const revalidate = 600;

/** 公開サイト側。URL には `(site)` は出ない — 外枠を `/studio` と分けるためだけの括り。 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
