import type { Metadata } from "next";
import type { ReactNode } from "react";

import { StudioNav } from "@/components/studio/StudioNav";
import { verifySession } from "@/lib/studio-session";

/**
 * 管理画面の外枠。
 *
 * (site) の外にあるので、サイトのヘッダーもフッターも Lenis も付いてこない。
 * 慣性スクロールは読み物には効くが、表を見ながら値を直す画面では邪魔になる。
 *
 * noindex は二重にかける — ここの metadata と proxy.ts の X-Robots-Tag。
 * robots.txt には書かない。書けば「/studio があります」と公開することになる。
 */
export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false, nocache: true },
};

export default async function StudioLayout({ children }: { children: ReactNode }) {
  const signedIn = await verifySession();

  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      {signedIn ? <StudioNav /> : null}
      <main className="flex-1">{children}</main>
    </div>
  );
}
