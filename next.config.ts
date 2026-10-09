import type { NextConfig } from "next";

import { products } from "./data/products";

const nextConfig: NextConfig = {
  // 外の画像は最適化しない（remotePatterns を置かない）。Cloudflare の画像変換は無料プランだと
  // 月 5,000 件までで、microCMS のホストを丸ごと許すと、誰でも別の画像を次々に変換させて
  // 枠を使い切れた（監査 12）。Blog の写真は microCMS 自身の画像 API で縮め（lib/microcms.ts の
  // blogImage）、Frame は外の URL を unoptimized で出す。
  async redirects() {
    return [
      // 旧カタログ（2026-09-25 にカメラマン撮影分へ入れ替え）。Ai だけは同じ一本なので URL が残っている。
      // 残りの八点は今の一覧に無いので一覧へ返す。戻ってくる可能性があるので恒久にはしない。
      { source: "/collection/ai", destination: "/collection/ai-indigo", permanent: true },
      {
        source:
          "/collection/:old(sakura|sakura-cherry|matsu|matsu-pine|wakaba|wakaba-celadon|kasane|kasane-silk|musubi|musubi-obi|hisui|hisui-jade|ichimatsu|ichimatsu-check|tsugi|tsugi-autumn)",
        destination: "/collection",
        permanent: false,
      },
      // 書き出し番号（folder、`bottle-07`）の URL → 作品の URL。作品のページは dynamicParams = false
      // なので、ページの中で送り直すことができない（一覧に無い URL は作らずに 404 になる）。
      // 一時（307）にしておく。転送元の folder は変わらないが、転送先の slug は仮の名前から作っていて、
      // 正式な名前が届くと変わる。恒久にするとブラウザが古い slug を覚え、変えたあと 404 に飛ぶ。
      ...products
        .filter((p) => p.folder !== p.slug)
        .map((p) => ({ source: `/collection/${p.folder}`, destination: `/collection/${p.slug}`, permanent: false })),
      // Journal → Blog（2026-08-31）。既に配ったリンクと検索結果を切らさない。
      { source: "/journal", destination: "/blog", permanent: true },
      { source: "/journal/:slug", destination: "/blog/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
