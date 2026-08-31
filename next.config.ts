import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // microCMS のメディア。Blog の写真だけがここから来る。
    remotePatterns: [{ protocol: "https", hostname: "images.microcms-assets.io" }],
  },
  async redirects() {
    return [
      { source: "/collection/sakura", destination: "/collection/sakura-cherry", permanent: true },
      { source: "/collection/ai", destination: "/collection/ai-indigo", permanent: true },
      { source: "/collection/matsu", destination: "/collection/matsu-pine", permanent: true },
      { source: "/collection/wakaba", destination: "/collection/wakaba-celadon", permanent: true },
      { source: "/collection/kasane", destination: "/collection/kasane-silk", permanent: true },
      { source: "/collection/musubi", destination: "/collection/musubi-obi", permanent: true },
      { source: "/collection/hisui", destination: "/collection/hisui-jade", permanent: true },
      { source: "/collection/ichimatsu", destination: "/collection/ichimatsu-check", permanent: true },
      { source: "/collection/tsugi", destination: "/collection/tsugi-autumn", permanent: true },
      // Journal → Blog（2026-08-31）。既に配ったリンクと検索結果を切らさない。
      { source: "/journal", destination: "/blog", permanent: true },
      { source: "/journal/:slug", destination: "/blog/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
