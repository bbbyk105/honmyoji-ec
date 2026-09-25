import { useState } from "react";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "@/components/motion/register";

/**
 * いまどの節を読んでいるか。章のレール（トップ）と記事の目次が使う。
 *
 * 節の上端が `start` の線を越えたらその節、戻って越えたら一つ前。二つの部品が
 * 同じ ScrollTrigger の組み方を手書きしていたのをここへ寄せた。
 *
 * `null` の節は監視しない。トップのヒーローは sticky で ScrollTrigger が測れないので、
 * 一つ目を null にして「二つ目より上なら一つ目」で決める（`ChapterRail` の註）。
 * id に対応する要素がまだ無い節も黙って飛ばす。
 */
export function useScrollSpy(ids: readonly (string | null)[], start: string): number {
  const [active, setActive] = useState(0);
  /* 配列は描画ごとに作り直されるので、中身で比べる。 */
  const key = ids.join("\n");

  useGSAP(
    () => {
      const triggers = ids.map((id, i) => {
        const el = id ? document.getElementById(id) : null;
        if (!el) return null;
        return ScrollTrigger.create({
          trigger: el,
          start,
          onEnter: () => setActive(i),
          onLeaveBack: () => setActive(Math.max(0, i - 1)),
        });
      });
      return () => triggers.forEach((trigger) => trigger?.kill());
    },
    { dependencies: [key, start] },
  );

  return active;
}
