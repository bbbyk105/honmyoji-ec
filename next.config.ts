import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // microCMS のメディア。Blog の写真だけがここから来る。
    remotePatterns: [{ protocol: "https", hostname: "images.microcms-assets.io" }],
  },
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
      // Journal → Blog（2026-08-31）。既に配ったリンクと検索結果を切らさない。
      { source: "/journal", destination: "/blog", permanent: true },
      { source: "/journal/:slug", destination: "/blog/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
