export type BlogImageRole = "blog" | "material-macro" | "lifestyle" | "process";
export type BlogImageRatio = "4/5" | "16/10" | "3/4" | "1/1";

/**
 * 本文のブロック。
 * `p` / `h` / `image` は手書きの記事（下の seed）用。
 * `html` は microCMS のリッチエディタから来る一塊の HTML — `.blog-prose` が組む。
 */
export type BlogBlock = {
  type: "p" | "h" | "image" | "html";
  text?: string;
  src?: string;
  alt?: string;
  caption?: string;
  ratio?: string;
  html?: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  titleJa: string;
  dek: string;
  date: string;
  season: string;
  topic: string;
  /** 未設定なら Frame が role / ratio のプレースホルダを出す */
  image?: string;
  imageAlt: string;
  imageRole: BlogImageRole;
  imageRatio: BlogImageRatio;
  pull?: string;
  body: BlogBlock[];
};

/**
 * 記事の本体は microCMS（`lib/microcms.ts`）にある。
 * ここに残っているのは **フォールバックの種**：
 * MICROCMS_SERVICE_DOMAIN / MICROCMS_API_KEY が無い環境（ローカル・プレビュー）や
 * API が落ちたときに、Blog が空にならないように使う。
 * 記事を足すのは microCMS の管理画面。ここは触らなくてよい。
 */
export const blogSeed: BlogPost[] = [
  {
    slug: "the-edge-that-remains",
    title: "The edge that remains",
    titleJa: "残る縁",
    dek: "Tatami-beri is made to be walked past. We ask it to be held.",
    date: "2026-03-12",
    season: "Spring",
    topic: "Materials",
    image: "/images/texture/weave-moegi.webp",
    imageAlt: "Green and gold tatami-beri woven over dark paper band, close",
    imageRole: "material-macro",
    imageRatio: "4/5",
    pull: "The same character, 縁, is also read en: the chance that two things meet.",
    body: [
      {
        type: "p",
        text: "A tatami room is finished at its edge. The tatami-beri — a woven band, often brocaded — is sewn around the mat so the straw will not fray, and so the room will have a colour of its own. When a room is remade, those bands are cut away. Most are thrown out.",
      },
      {
        type: "p",
        text: "We keep them. Not as nostalgia, and not as a lesson in waste. The fabric is simply too particular to discard: silk-like thread, a pattern chosen for one household, a colour that existed for a floor and nowhere else.",
      },
      {
        type: "image",
        src: "/images/scenes/altar-close.webp",
        alt: "Three bottle bags standing on brocade before the altar of the main hall",
        caption: "Before the altar of the main hall.",
        ratio: "4/5",
      },
      {
        type: "h",
        text: "A textile with a previous life",
      },
      {
        type: "p",
        text: "Each strip arrives already decided. We do not dye it. We do not reprint it. We cut, weave, and join what the tatami maker has left — around a frame of paper band recycled in the same city. The bag is the second room the fabric inhabits.",
      },
      {
        type: "p",
        text: "The same character, 縁, is also read en: the chance that two things meet. A leftover edge, a pair of hands at the temple, a person who will carry it. That is the whole method.",
      },
    ],
  },
  {
    slug: "holding-the-weave",
    title: "Holding the weave",
    titleJa: "織りを持つ",
    dek: "A short note on how these bags like to be used, and how they last.",
    date: "2026-04-02",
    season: "Spring",
    topic: "Care",
    image: "/images/scenes/hands-front.webp",
    imageAlt: "Hands holding a bottle bag by its handle",
    imageRole: "lifestyle",
    imageRatio: "3/4",
    body: [
      {
        type: "p",
        text: "Tatami-beri was made to take footsteps. It is a stubborn cloth. Still, a bag is not a floor. Treat it as you would a favourite jacket — used, not tested.",
      },
      {
        type: "h",
        text: "Daily use",
      },
      {
        type: "p",
        text: "The bottle bags will take a 720 ml bottle, a rolled cloth, chopsticks, a small sheaf of papers. They prefer a clean, dry interior. Do not ask them to carry wet umbrellas or leaking flasks.",
      },
      {
        type: "p",
        text: "The totes are softer. They sit under the arm or on a shoulder. Keep sharp-toothed keys out of the pockets; they will snag the weave.",
      },
      {
        type: "image",
        src: "/images/scenes/water-basin.webp",
        alt: "Stone water basin in the temple garden",
        caption: "Water, not washing machines.",
        ratio: "1/1",
      },
      {
        type: "h",
        text: "Cleaning",
      },
      {
        type: "p",
        text: "Spot clean. A barely damp cloth, pressed, not rubbed. No machine, no soaking, no bleaching in the sun. If something goes seriously wrong, write to us before you try to repair it — we know how the piece was put together.",
      },
      {
        type: "p",
        text: "Store it standing, or hanging by the handle, away from moths and direct light. The paper band likes dry air.",
      },
    ],
  },
  {
    slug: "notes-from-fuji",
    title: "Notes from Fuji",
    titleJa: "富士からの手記",
    dek: "The temple, the mountain, and the city that recycles its paper into band.",
    date: "2026-05-18",
    season: "Early summer",
    topic: "Place",
    image: "/images/stock/fuji-dusk.webp",
    imageAlt: "Mount Fuji at dusk, seen from Fujinomiya, Shizuoka",
    imageRole: "lifestyle",
    imageRatio: "16/10",
    pull: "The paper band is made here, from cartons and waste paper. The edging is saved from rooms a few streets away.",
    body: [
      {
        type: "p",
        text: "Honmyoji sits in Nakazato, Fuji City. Behind the main hall is a bamboo grove; in front, on a clear day, the mountain. The bags are made inside these grounds — not as temple merchandise, but because this is where the maker lives, and where the materials already are.",
      },
      {
        type: "p",
        text: "The paper band is made here, from cartons and waste paper. The edging is saved from rooms a few streets away. Fuji is not a backdrop we borrowed for a photograph. It is the supply chain.",
      },
      {
        type: "image",
        src: "/images/scenes/temple-hall.webp",
        alt: "The main hall of Honmyoji",
        caption: "The room where finished pieces are set down.",
        ratio: "4/5",
      },
      {
        type: "h",
        text: "A working temple",
      },
      {
        type: "p",
        text: "Workshops and kimono gatherings happen in the same halls. A completed bag is placed before the altar and a prayer is said over it — not as theatre, but out of habit. Then it leaves.",
      },
      {
        type: "p",
        text: "If you visit, the mountain may be hidden. That is ordinary. The weave does not depend on a view.",
      },
    ],
  },
  {
    slug: "one-encounter",
    title: "One encounter",
    titleJa: "一期一会",
    dek: "Why a bag is made once, and why we will not make it again.",
    date: "2026-06-09",
    season: "Rainy season",
    topic: "Making",
    image: "/images/scenes/altar-standing.webp",
    imageAlt: "Finished bags standing before the altar",
    imageRole: "process",
    imageRatio: "16/10",
    body: [
      {
        type: "p",
        text: "We do not keep a pattern library. A piece begins with the strips on the table that week — their width, their remaining length, the way a gold diamond sits on a green ground. The next week the table is different.",
      },
      {
        type: "p",
        text: "This is not scarcity as a sales idea. It is the material telling the truth. Two bags can share a silhouette and still refuse to be twins.",
      },
      {
        type: "image",
        src: "/images/scenes/statue-mono.webp",
        alt: "A quiet statue in the temple grounds",
        caption: "The grounds at dusk.",
        ratio: "3/4",
      },
      {
        type: "h",
        text: "If the piece you wanted is gone",
      },
      {
        type: "p",
        text: "Write to us. We can work in a similar spirit — a height, a handle, a family of colours — but we will not remake the one that has gone. That meeting has already happened.",
      },
      {
        type: "p",
        text: "Ichigo ichie is usually said of tea. It also describes an offcut of tatami-beri that will never come again, and the person who happens to need a bag that week.",
      },
    ],
  },
];

/** 新しい記事が先頭。microCMS 側も seed 側もこの順で並べる。 */
export function byNewest(a: BlogPost, b: BlogPost): number {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

export function formatBlogDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

/** 記事メタの一行（Topic · Season / Topic · 日付）。空の項目で「 · 」だけ残さない。 */
export function blogMeta(...parts: (string | undefined)[]): string {
  return parts.filter((p) => p && p.trim()).join(" · ");
}
