/**
 * 商品カタログ（コード内）。価格・在庫ステータスの変更＝このファイルの編集。
 *
 * SKU 体系（内容.txt 11 より）: MI = MIROKU / BAG = バッグ / 001 = 作品番号
 *   MI-BAG-xxx 畳の縁バッグ, MI-KIM-xxx トートバッグ, MI-PO 小物ポーチ, MI-ST ショルダー紐, MI-ZK 小物
 *   MI-KIM は先方の SKU 体系のまま（元は「着物リメイク」の略）。表示は Tote Bag。
 *
 * 価格は AUD（オーストラリアドル）固定表示。為替で日々動かさず、改定時にここを書き換える運用。
 * 寸法・重量は「それぞれ測ってお送りします」のため暫定値 — 実測後に差し替えること。
 */

export type ProductStatus = "available" | "reserved" | "sold_out" | "coming_soon" | "made_to_order";
export type ProductLine = "tatami-beri" | "tote-bag";
export type UseTag = "Daily Bag" | "Formal" | "Interior" | "Gift";

export type Product = {
  /** Public URL: /collection/<slug> */
  slug: string;
  /** Image folder under public/images/products/ */
  folder: string;
  sku: string;
  name: string;
  kanji: string;
  reading: string;
  line: ProductLine;
  priceAud: number;
  status: ProductStatus;
  /** バッグ一言。一覧カードとヒーローの副題 */
  note: string;
  noteJa: string;
  /** 作品の物語（詳細ページ） */
  story: string;
  storyJa: string;
  materials: string[];
  size: { width: number; height: number; depth: number; handleDrop: number };
  weightG: number | null;
  tags: UseTag[];
  /** public/images/products/<folder>/1.webp … n.webp */
  galleryCount: number;
  /** 一覧の浮遊表示でカットアウトが占める高さの比（背の高い瓶バッグ = 1） */
  cutoutScale: number;
  /** cutout.webp の 縦横比 (w/h)。全タイル同寸の展示台に対して像の枠を決めるのに使う。
   *  値は scripts/prepare-images.py の出力から取る（写真を撮り直したら更新すること）。 */
  cutoutAspect: number;
};

export const STATUS_LABEL: Record<ProductStatus, { en: string; ja: string }> = {
  available: { en: "Available", ja: "購入可能" },
  reserved: { en: "Reserved", ja: "取り置き中" },
  sold_out: { en: "Sold Out", ja: "完売" },
  coming_soon: { en: "Coming Soon", ja: "販売予定" },
  /** 写真の一点は出たが、同じ形を別の色で織り直せるもの。一点物ではないので価格も別建て。 */
  made_to_order: { en: "Made to Order", ja: "受注生産（色違い）" },
};

export const LINE_LABEL: Record<ProductLine, { en: string; ja: string }> = {
  "tatami-beri": { en: "Tatami-beri Bottle Bag", ja: "畳の縁 ボトルバッグ" },
  "tote-bag": { en: "Tote Bag", ja: "トートバッグ" },
};

const TATAMI_MATERIALS = [
  "Tatami-beri (tatami edging fabric, remnants)",
  "Japanese craft paper band — 100% recycled paper, made in Fuji City",
];
/* トートも中身は畳の縁。着物地は使っていない（2026-09-01 先方確認）。 */
const TOTE_MATERIALS = [
  "Tatami-beri (tatami edging fabric, remnants)",
  "Cotton lining",
];

export const products: Product[] = [
  {
    slug: "sakura-cherry",
    folder: "sakura",
    sku: "MI-BAG-001",
    name: "Sakura",
    kanji: "桜",
    reading: "さくら",
    line: "tatami-beri",
    priceAud: 150,
    status: "available",
    note: "Cherry-pink tatami-beri over a chestnut weave, with a fringed handle.",
    noteJa: "栗色の縁に桜色を重ね、持ち手には房飾りを。",
    story:
      "The pink and burgundy bands were cut from the edging of a formal tatami room in Fuji City. Woven around a tall paper-band frame, they hold a 720 ml bottle of sake — or a rolled scroll, a bundle of chopsticks, a small bouquet. The fringe on the handle is hand-tied from the fabric's own loose ends.",
    storyJa:
      "桜色と海老茶の縁は、富士市の座敷から出た端材です。背の高い紙バンドの骨組みに織り込み、日本酒の四合瓶がすっと収まります。持ち手の房は、縁の余り糸を手で結んだもの。",
    materials: TATAMI_MATERIALS,
    size: { width: 12, height: 31, depth: 12, handleDrop: 14 },
    weightG: null,
    tags: ["Gift", "Interior", "Formal"],
    galleryCount: 5,
    cutoutScale: 1,
    cutoutAspect: 0.352,   // 493×1400
  },
  {
    slug: "ai-indigo",
    folder: "ai",
    sku: "MI-BAG-002",
    name: "Ai",
    kanji: "藍",
    reading: "あい",
    line: "tatami-beri",
    priceAud: 190,
    status: "available",
    note: "Indigo, moss and sky-blue bands beneath a hand-braided navy handle.",
    noteJa: "藍・苔・空色の縁に、紺の編み手。",
    story:
      "Three shades of blue-green tatami-beri, each from a different room, meet in one column. The braided handle is knotted from navy paper cord and sits high, so the bag hangs from the wrist without touching the sleeve of a kimono. Tall enough for a 1.8 L isshōbin.",
    storyJa:
      "違う部屋から出た三種の青緑の縁が、一本の柱に集まりました。紺の紙紐で編んだ持ち手は高めに付け、着物の袖に触れず手首に掛かります。一升瓶が入る高さです。",
    materials: TATAMI_MATERIALS,
    size: { width: 12, height: 36, depth: 12, handleDrop: 16 },
    weightG: null,
    tags: ["Gift", "Formal", "Daily Bag"],
    galleryCount: 5,
    cutoutScale: 0.9,
    cutoutAspect: 0.559,   // 782×1400
  },
  {
    slug: "matsu-pine",
    folder: "matsu",
    sku: "MI-BAG-003",
    name: "Matsu",
    kanji: "松",
    reading: "まつ",
    line: "tatami-beri",
    priceAud: 240,
    status: "reserved",
    note: "Pine-green diamond brocade with a woven paper handle.",
    noteJa: "松葉色の菱文に、紙バンドを編んだ持ち手。",
    story:
      "Deep green edging with a gold diamond pattern — the kind found around the tatami of a temple's main hall. The handle is woven from the same paper band as the body, so the whole bag is one continuous material. Fits a wine bottle with room to spare.",
    storyJa:
      "本堂の畳に使われるような、金の菱文が入った深い緑の縁。持ち手は本体と同じ紙バンドを編んでいるので、全体がひと続きの素材でできています。ワインボトルが余裕を持って収まります。",
    materials: TATAMI_MATERIALS,
    size: { width: 13, height: 30, depth: 13, handleDrop: 15 },
    weightG: null,
    tags: ["Daily Bag", "Gift"],
    galleryCount: 5,
    cutoutScale: 0.88,
    cutoutAspect: 0.569,   // 797×1400
  },
  {
    slug: "wakaba-celadon",
    folder: "wakaba",
    sku: "MI-BAG-004",
    name: "Wakaba",
    kanji: "若葉",
    reading: "わかば",
    line: "tatami-beri",
    priceAud: 160,
    status: "available",
    note: "Pale mint and celadon — the quietest bag in the collection.",
    noteJa: "薄荷と青磁の淡い縁。いちばん静かな一本。",
    story:
      "Photographed in the bamboo grove behind the temple, where its colours came from. Pale green bands with a fine white thread catch the light differently at every angle. A low, unadorned handle keeps the silhouette simple.",
    storyJa:
      "この色の出どころである、お寺の裏の竹林で撮りました。白い糸が織り込まれた淡い緑の縁は、角度ごとに光り方が変わります。飾りのない低い持ち手で、輪郭を簡素に。",
    materials: TATAMI_MATERIALS,
    size: { width: 12, height: 29, depth: 12, handleDrop: 12 },
    weightG: null,
    tags: ["Daily Bag", "Interior"],
    galleryCount: 4,
    cutoutScale: 1,
    cutoutAspect: 0.377,   // 382×1012
  },
  {
    slug: "kasane-silk",
    folder: "kasane",
    sku: "MI-KIM-001",
    name: "Kasane",
    kanji: "重",
    reading: "かさね",
    line: "tote-bag",
    priceAud: 190,
    status: "sold_out",
    note: "A slim tote in deep teal, with bands of patterned tatami-beri run the full height.",
    noteJa: "青緑の本体に、柄の縁を縦に通した細身のトート。",
    story:
      "Bands of gold-patterned tatami-beri are set into deep teal cloth, running the full height of the bag so that no pattern is cut short. Long handles sit on the shoulder, and the body folds flat when it is empty.",
    storyJa:
      "青緑の生地に、金の柄の縁を縦に通しました。丈いっぱいに通してあるので、柄が途中で切れません。長めの持ち手は肩に掛かり、空のときは平らに畳めます。",
    materials: TOTE_MATERIALS,
    size: { width: 26, height: 34, depth: 8, handleDrop: 28 },
    weightG: null,
    tags: ["Daily Bag", "Formal"],
    galleryCount: 2,
    cutoutScale: 0.92,
    cutoutAspect: 0.546,   // 765×1400
  },
  {
    slug: "musubi-obi",
    folder: "musubi",
    sku: "MI-KIM-002",
    name: "Musubi",
    kanji: "結",
    reading: "むすび",
    line: "tote-bag",
    priceAud: 210,
    status: "sold_out",
    note: "Triangular patchwork of tatami-beri with a tortoiseshell-look handle.",
    noteJa: "縁を三角に継ぎ合わせ、鼈甲調の持ち手を。",
    story:
      "Wine-red and gold tatami-beri pieced into triangles, so the bag opens wide and closes flat like a furoshiki knot. The rigid arched handle is a vintage piece.",
    storyJa:
      "海老茶と金の縁を三角に継ぎ、風呂敷の結び目のように大きく開いて平らに畳めます。弓なりの持ち手は古いもの。",
    materials: TOTE_MATERIALS,
    size: { width: 34, height: 22, depth: 12, handleDrop: 9 },
    weightG: null,
    tags: ["Formal", "Gift"],
    galleryCount: 2,
    cutoutScale: 0.76,
    cutoutAspect: 0.769,   // 1076×1400
  },
  {
    slug: "hisui-jade",
    folder: "hisui",
    sku: "MI-KIM-003",
    name: "Hisui",
    kanji: "翡翠",
    reading: "ひすい",
    line: "tote-bag",
    priceAud: 330,
    status: "made_to_order",
    note: "Jade-green tote with a row of leaf-shaped tatami-beri windows.",
    noteJa: "翡翠色の本体に、葉のかたちの縁を窓のように。",
    story:
      "A wide, boxy tote for the market or the tea room. Leaf-shaped panels of tatami-beri are set into the green cloth, each one cut from a different remnant. The cloth in the photograph is finished, but the same bag is woven to order in another set of colours.",
    storyJa:
      "市場にも茶室にも似合う、幅広の箱型トート。緑の生地に、葉のかたちの縁を窓のように嵌め込みました。それぞれ違う端材から切り出しています。写真の生地は使い切りましたが、同じ形を別の色でお作りできます。",
    materials: TOTE_MATERIALS,
    size: { width: 40, height: 24, depth: 14, handleDrop: 18 },
    weightG: null,
    tags: ["Daily Bag", "Interior"],
    galleryCount: 1,
    cutoutScale: 0.78,
    cutoutAspect: 0.69,   // 966×1400
  },
  {
    slug: "ichimatsu-check",
    folder: "ichimatsu",
    sku: "MI-KIM-004",
    name: "Ichimatsu",
    kanji: "市松",
    reading: "いちまつ",
    line: "tote-bag",
    priceAud: 330,
    status: "made_to_order",
    note: "Green-on-green checkerboard of tatami-beri squares.",
    noteJa: "緑と緑の市松。縁を四角に切って並べました。",
    story:
      "Squares of two green tatami-beri patterns, alternated like the ichimatsu check of a kabuki costume. Soft-sided, with a short handle — for a lunch box, a book, and a fan. The greens in the photograph are finished, but the same checkerboard is woven to order in another set of colours.",
    storyJa:
      "二種類の緑の縁を四角に切り、歌舞伎衣装の市松のように交互に並べました。柔らかい仕立てで、短い持ち手。お弁当と本と扇子のために。写真の緑は使い切りましたが、同じ市松を別の色でお作りできます。",
    materials: TOTE_MATERIALS,
    size: { width: 30, height: 20, depth: 12, handleDrop: 10 },
    weightG: null,
    tags: ["Daily Bag"],
    galleryCount: 1,
    cutoutScale: 0.66,
    cutoutAspect: 1.03,   // 1178×1144
  },
  {
    slug: "tsugi-autumn",
    folder: "tsugi",
    sku: "MI-KIM-005",
    name: "Tsugi",
    kanji: "継",
    reading: "つぎ",
    line: "tote-bag",
    priceAud: 150,
    status: "sold_out",
    note: "Flat clutch of twelve tatami-beri squares in autumn browns.",
    noteJa: "秋の茶を十二枚。縁を継いだ平たいクラッチ。",
    story:
      "The first bag in the series. Twelve squares of brown, rust and mauve edging, joined with a single strap. Sits under the arm or hangs on a wall as a textile — it was photographed on the temple's garden wall.",
    storyJa:
      "シリーズ最初の一点。茶・錆・藤の縁を十二枚継ぎ、一本の紐を付けました。小脇に抱えても、布として壁に掛けても。お寺の庭の壁で撮影しました。",
    materials: TOTE_MATERIALS,
    size: { width: 30, height: 25, depth: 3, handleDrop: 6 },
    weightG: null,
    tags: ["Interior", "Formal"],
    galleryCount: 1,
    cutoutScale: 0.78,
    cutoutAspect: 0.683,   // 742×1086
  },
];

export function getProduct(key: string): Product | undefined {
  return products.find((p) => p.slug === key || p.folder === key);
}

function folderOf(key: string): string {
  return getProduct(key)?.folder ?? key;
}

export function productImage(key: string, n: number): string {
  return `/images/products/${folderOf(key)}/${n}.webp`;
}

export function productCutout(key: string): string {
  return `/images/products/${folderOf(key)}/cutout.webp`;
}

export function productPath(product: Product): string {
  return `/collection/${product.slug}`;
}

/**
 * 価格の表記はここ一箇所。サイト中どこでも `A$220`。
 *
 * ロケールは en-AU にしない — AUD を en-AU で組むと記号が素の `$` になり、
 * どの国のドルなのか分からない見た目に戻る。en-US（= CLDR の標準記号）で `A$`。
 * `currencyDisplay: "code"` の `AUD 220` は、値札というより仕切書の書き方になる。
 */
export const aud = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

export function cm(v: number): string {
  return `${v} cm (${(v / 2.54).toFixed(1)} in)`;
}

export function isPurchasable(p: Product): boolean {
  return p.status === "available";
}
