export type JournalEntry = {
  slug: string;
  title: string;
  titleJa: string;
  dek: string;
  date: string;
  season: string;
  topic: string;
  image: string;
  imageAlt: string;
  imageRole: "journal" | "material-macro" | "lifestyle" | "process";
  imageRatio: "4/5" | "16/10" | "3/4" | "1/1";
  pull?: string;
  body: { type: "p" | "h" | "image"; text?: string; src?: string; alt?: string; caption?: string; ratio?: string }[];
};

export const journal: JournalEntry[] = [
  {
    slug: "the-edge-that-remains",
    title: "The edge that remains",
    titleJa: "残る縁",
    dek: "Tatami-beri is made to be walked past. We ask it to be held.",
    date: "2026-03-12",
    season: "Spring",
    topic: "Materials",
    image: "/images/texture/beri-indigo.webp",
    imageAlt: "Indigo, moss and sky-blue tatami-beri woven over paper band",
    imageRole: "material-macro",
    imageRatio: "4/5",
    pull: "The same character, 縁, is also read en: the chance that two things meet.",
    body: [
      {
        type: "p",
        text: "A tatami room is finished at its edge. The ber-i — a woven band, often brocaded — is sewn around the mat so the straw will not fray, and so the room will have a colour of its own. When a room is remade, those bands are cut away. Most are thrown out.",
      },
      {
        type: "p",
        text: "We keep them. Not as nostalgia, and not as a lesson in waste. The fabric is simply too particular to discard: silk-like thread, a pattern chosen for one household, a colour that existed for a floor and nowhere else.",
      },
      {
        type: "image",
        src: "/images/texture/beri-sakura.webp",
        alt: "Cherry-pink tatami-beri, close",
        caption: "Sakura ber-i · remnant from a formal room in Fuji",
        ratio: "16/10",
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
    image: "/images/scenes/bamboo-pair.webp",
    imageAlt: "Two tatami-beri bags standing in bamboo light",
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
        text: "The kimono remakes are softer. They sit under the arm or on a shoulder. Empty pockets of keys with sharp teeth; they will mark the silk.",
      },
      {
        type: "image",
        src: "/images/scenes/water-basin.webp",
        alt: "Stone water basin in the temple garden",
        caption: "Process note · water, not washing machines",
        ratio: "1/1",
      },
      {
        type: "h",
        text: "Cleaning",
      },
      {
        type: "p",
        text: "Spot clean. A barely damp cloth, pressed, not rubbed. No machine, no soak, no sun-bleach. If something serious happens, write to us before you try to repair it. We know the join.",
      },
      {
        type: "p",
        text: "Store standing, or hanging by the handle, away from moth and direct light. The paper band likes dry air.",
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
    image: "/images/scenes/fuji.webp",
    imageAlt: "Mount Fuji under a clear sky, seen from Fuji City",
    imageRole: "lifestyle",
    imageRatio: "16/10",
    pull: "The paper band is made here, from cartons and waste paper. The edging is saved from rooms a few streets away.",
    body: [
      {
        type: "p",
        text: "Honmyoji sits in Nakazato, Fuji City. Behind the main hall is a bamboo grove; in front, on a clear day, the mountain. The bags are made in this precinct — not as temple merchandise, but because this is where the maker lives, and where the materials already are.",
      },
      {
        type: "p",
        text: "The paper band is made here, from cartons and waste paper. The edging is saved from rooms a few streets away. Fuji is not a backdrop we borrowed for a photograph. It is the supply chain.",
      },
      {
        type: "image",
        src: "/images/scenes/temple-hall.webp",
        alt: "The main hall of Honmyoji",
        caption: "Honmyoji · the room where finished pieces are set down",
        ratio: "4/5",
      },
      {
        type: "h",
        text: "A working temple",
      },
      {
        type: "p",
        text: "Workshops and kimono gatherings happen in the same halls. A completed bag is placed before the altar and offered a prayer — not as theatre, as habit. Then it leaves.",
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
    image: "/images/scenes/prayer-altar.webp",
    imageAlt: "Finished bags placed before the altar",
    imageRole: "process",
    imageRatio: "4/5",
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
        alt: "A quiet statue in the temple precinct",
        caption: "Process / place · the precinct at dusk",
        ratio: "3/4",
      },
      {
        type: "h",
        text: "If the piece you wanted is gone",
      },
      {
        type: "p",
        text: "Write. We can work in a similar spirit — a height, a handle, a family of colours — but we will not reprint the one that left. That meeting has already happened.",
      },
      {
        type: "p",
        text: "Ichigo ichie is usually said of tea. It also describes a leftover of ber-i that will not come again, and the person who happens to need a bag that week.",
      },
    ],
  },
];

export function getEntry(slug: string): JournalEntry | undefined {
  return journal.find((e) => e.slug === slug);
}

export function formatJournalDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}
