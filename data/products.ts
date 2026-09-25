/**
 * 商品カタログ（コード内）。価格・在庫ステータスの変更＝このファイルの編集（か /studio）。
 *
 * 2026-09-25 にカメラマン撮影分（2026-09-04 撮影・26 点）へ入れ替えた。写真は
 * `scripts/prepare-photos.py` が `image/`（クライアントの書き出し）から作る。
 *
 * **名前・読み・一言・物語・寸法は仮**。先方から正式な名前と文言が届いたら差し替える。
 * 名前は写真の色から付けた伝統色・文様の名で、事実として言えるのは写真に写っているもの
 * （色・柄・持ち手）だけ。来歴（どの部屋の縁か等）は書いていない — 聞いてから足すこと。
 *
 * **価格は未定**（`priceAud: null`）。値段が無いものは買えないので、完売以外は
 * `coming_soon` にしてある。値段が決まったら /studio で価格を入れて Available に
 * 切り替えれば、コードを触らずに売り場へ出る（`isPurchasable` は価格があるときだけ真）。
 *
 * SKU 体系（内容.txt 11 より）: MI = MIROKU / BAG = バッグ / 001 = 作品番号
 *   MI-BAG-xxx 畳の縁バッグ, MI-KIM-xxx 着物リメイク, MI-PO 小物ポーチ, MI-ST ショルダー紐, MI-ZK 小物
 *   ボトルバッグの 001–013 はクライアントの書き出し名（バンブー中1 … 小13）の番号と揃えてある。
 *
 * 価格は AUD（オーストラリアドル）固定表示。為替で日々動かさず、改定時にここを書き換える運用。
 */

export type ProductStatus = "available" | "reserved" | "sold_out" | "coming_soon" | "made_to_order";
export type ProductLine = "tatami-beri" | "origami" | "handbag" | "kimono" | "apron";
export type BottleSize = "Small" | "Medium" | "Large";

export type Product = {
  /** Public URL: /collection/<slug> */
  slug: string;
  /** Image folder under public/images/products/ — クライアントの番号で付ける（名前が変わっても動かない） */
  folder: string;
  sku: string;
  name: string;
  kanji: string;
  reading: string;
  line: ProductLine;
  /** 未定なら null。null のあいだは買えない（`isPurchasable`）。 */
  priceAud: number | null;
  status: ProductStatus;
  /** 一言。一覧の下と商品ページの副題 */
  note: string;
  noteJa: string;
  /** 商品ページの本文 */
  story: string;
  storyJa: string;
  materials: string[];
  /** 実測前は null（商品ページは「発送前に計測」と出す） */
  size: { width: number; height: number; depth: number; handleDrop: number } | null;
  /** ボトルバッグの大きさ。書き出し名の 大 / 中 / 小 */
  bottleSize?: BottleSize;
  weightG: number | null;
  /** public/images/products/<folder>/1.webp … n.webp。1 が主役（比率は `LINE_RATIO`） */
  galleryCount: number;
};

export const STATUS_LABEL: Record<ProductStatus, { en: string; ja: string }> = {
  available: { en: "Available", ja: "購入可能" },
  reserved: { en: "Reserved", ja: "取り置き中" },
  sold_out: { en: "Sold out", ja: "完売" },
  coming_soon: { en: "Coming soon", ja: "販売予定" },
  /** 写真の一点は出たが、同じ形を別の色で織り直せるもの。一点物ではないので価格も別建て。 */
  made_to_order: { en: "Made to order", ja: "受注生産（色違い）" },
};

export const LINE_LABEL: Record<ProductLine, { en: string; ja: string; plural: string }> = {
  "tatami-beri": { en: "Tatami-beri bottle bag", ja: "畳の縁 ボトルバッグ", plural: "Bottle bags" },
  origami: { en: "Origami bag", ja: "折り紙バッグ", plural: "Origami bags" },
  handbag: { en: "Tatami-beri handbag", ja: "畳の縁 ハンドバッグ", plural: "Handbags" },
  kimono: { en: "Kimono shoulder bag", ja: "着物 ショルダーバッグ", plural: "Shoulder bags" },
  apron: { en: "Kimono apron", ja: "着物 エプロン", plural: "Aprons" },
};

/** 区分ごとの一文。何でできていて、どういう形か —— それ以上は言わない。 */
export const LINE_BLURB: Record<ProductLine, string> = {
  "tatami-beri":
    "Tatami-beri woven over paper band recycled in Fuji City. Three heights — small, medium and large — each made to carry a bottle.",
  origami: "Wide bands of tatami-beri folded from one flat piece into a bag that stands on its point.",
  handbag: "Tatami-beri pieced into diamonds under a carved handle, or woven over and under like a basket.",
  kimono: "Vintage kimono cloth, cut and pieced into a crescent on a long strap.",
  apron: "Aprons with a panel and pocket of vintage kimono cloth.",
};

/** 一覧に並べる順（区分ごとに節を組む — `app/(site)/collection/page.tsx`） */
export const LINE_ORDER: ProductLine[] = ["tatami-beri", "origami", "handbag", "kimono", "apron"];

/**
 * 主役（1.webp）の比率。立つもの（ボトル・折り紙）は 4:5 に背丈を揃えて切り、
 * 横に広いもの・平置きのものはカメラマンの画角のまま 3:2（`scripts/prepare-photos.py`）。
 * ここを変えるときは script の `crop` も合わせる — 片方だけ変えると object-cover が二度切る。
 */
export const LINE_RATIO: Record<ProductLine, "4/5" | "3/2"> = {
  "tatami-beri": "4/5",
  origami: "4/5",
  handbag: "3/2",
  kimono: "3/2",
  apron: "3/2",
};

const BOTTLE_MATERIALS = [
  "Tatami-beri (tatami edging fabric, remnants)",
  "Japanese craft paper band — 100% recycled paper, made in Fuji City",
];
const ORIGAMI_MATERIALS = ["Tatami-beri (tatami edging fabric), wide bands sewn and folded"];
const KIMONO_MATERIALS = ["Vintage kimono fabric, pieced by hand"];

export const products: Product[] = [
  /* ---- Bottle bags（バンブー 中1–6・大7・小8–13）-------------------------------- */
  {
    slug: "tokiwa-evergreen",
    folder: "bottle-01",
    sku: "MI-BAG-001",
    name: "Tokiwa",
    kanji: "常磐",
    reading: "ときわ",
    line: "tatami-beri",
    priceAud: null,
    status: "coming_soon",
    note: "Evergreen and cream in a close check, under a pale woven handle.",
    noteJa: "常磐色と生成りの細かな市松に、淡い色の編み手。",
    story:
      "Deep green tatami-beri and cream paper band cross at every row, so the check stays even all the way round. The handle is woven from the same pale band as the frame.",
    storyJa:
      "深い緑の縁と生成りの紙バンドが一段ごとに交わり、どこから見ても市松が崩れません。持ち手は骨組みと同じ淡い紙バンドで編んでいます。",
    materials: BOTTLE_MATERIALS,
    size: null,
    bottleSize: "Medium",
    weightG: null,
    galleryCount: 2,
  },
  {
    slug: "akane-madder",
    folder: "bottle-02",
    sku: "MI-BAG-002",
    name: "Akane",
    kanji: "茜",
    reading: "あかね",
    line: "tatami-beri",
    priceAud: null,
    status: "sold_out",
    note: "Madder red and blossom pink, with gold medallions and a red handle.",
    noteJa: "茜と桜色に金の紋。持ち手も赤で。",
    story:
      "Red tatami-beri with gold medallions alternates with a pale pink band of small flowers. Even the handle is wrapped in red — the warmest piece in the series.",
    storyJa:
      "金の紋が入った赤い縁と、小花の淡い桜色の縁を交互に。持ち手まで赤で巻いた、この連作でいちばん温かい一本です。",
    materials: BOTTLE_MATERIALS,
    size: null,
    bottleSize: "Medium",
    weightG: null,
    galleryCount: 2,
  },
  {
    slug: "rikyu-grey-green",
    folder: "bottle-03",
    sku: "MI-BAG-003",
    name: "Rikyū",
    kanji: "利休",
    reading: "りきゅう",
    line: "tatami-beri",
    priceAud: null,
    status: "coming_soon",
    note: "Grey-green, silver and sage, with a slate handle.",
    noteJa: "利休鼠と銀、苔の色。持ち手は石板の色。",
    story:
      "The quietest of the medium bags: grey-green, silver and sage bands, one black row near the middle, and a handle wrapped in slate grey.",
    storyJa:
      "中サイズでいちばん静かな一本。利休鼠・銀・苔の縁に、真ん中あたりに黒を一段。持ち手は石板のような灰色で巻いています。",
    materials: BOTTLE_MATERIALS,
    size: null,
    bottleSize: "Medium",
    weightG: null,
    galleryCount: 2,
  },
  {
    slug: "seiji-celadon",
    folder: "bottle-04",
    sku: "MI-BAG-004",
    name: "Seiji",
    kanji: "青磁",
    reading: "せいじ",
    line: "tatami-beri",
    priceAud: null,
    status: "coming_soon",
    note: "Celadon, teal and a line of blue, under a pale woven handle.",
    noteJa: "青磁と青緑、ひと筋の青。淡い色の編み手。",
    story:
      "Celadon and teal tatami-beri with a single band of blue running through, set against the warm tone of the paper band. The pale handle keeps the colours cool.",
    storyJa:
      "青磁と青緑の縁に、青をひと筋。紙バンドの温かい地色の上で、淡い持ち手が全体を涼しく見せます。",
    materials: BOTTLE_MATERIALS,
    size: null,
    bottleSize: "Medium",
    weightG: null,
    galleryCount: 2,
  },
  {
    slug: "moegi-spring-green",
    folder: "bottle-05",
    sku: "MI-BAG-005",
    name: "Moegi",
    kanji: "萌黄",
    reading: "もえぎ",
    line: "tatami-beri",
    priceAud: null,
    status: "coming_soon",
    note: "Spring green and gold with grey, under a charcoal handle.",
    noteJa: "萌黄と金に灰を合わせ、炭色の持ち手。",
    story:
      "Bright spring-green tatami-beri threaded with gold, calmed by rows of grey. The charcoal handle is wrapped tight and rises well above the rim.",
    storyJa:
      "金糸の入った明るい萌黄の縁を、灰色の段で落ち着かせました。炭色の持ち手は固く巻き、口より高く立ち上げています。",
    materials: BOTTLE_MATERIALS,
    size: null,
    bottleSize: "Medium",
    weightG: null,
    galleryCount: 4,
  },
  {
    slug: "hanada-pale-indigo",
    folder: "bottle-05b",
    sku: "MI-BAG-014",
    name: "Hanada",
    kanji: "縹",
    reading: "はなだ",
    line: "tatami-beri",
    priceAud: null,
    status: "sold_out",
    note: "Pale indigo and blue-grey, under a woven paper handle.",
    noteJa: "縹色と青鈍に、紙バンドの編み手。",
    story:
      "Bands of pale indigo and blue-grey, patterned in white and gold, woven onto a warm paper frame. The handle is plain paper band, so the blues do all the talking.",
    storyJa:
      "白と金の柄が入った縹色・青鈍の縁を、温かい色の紙の骨組みに。持ち手は素の紙バンドにして、青だけを見せています。",
    materials: BOTTLE_MATERIALS,
    size: null,
    bottleSize: "Medium",
    weightG: null,
    galleryCount: 3,
  },
  {
    slug: "kuchiba-fallen-leaf",
    folder: "bottle-06",
    sku: "MI-BAG-006",
    name: "Kuchiba",
    kanji: "朽葉",
    reading: "くちば",
    line: "tatami-beri",
    priceAud: null,
    status: "coming_soon",
    note: "Chestnut, plum, rust and mint — the colours of late autumn.",
    noteJa: "栗・葡萄・錆・薄荷。晩秋の色を重ねて。",
    story:
      "Chestnut and plum tatami-beri, a rust band with gold, and a line of pale mint to lift it. A woven paper handle in the frame's own colour.",
    storyJa:
      "栗色と葡萄色の縁に、金の入った錆色、差し色に薄荷をひと筋。持ち手は骨組みと同じ色の紙バンドで編んでいます。",
    materials: BOTTLE_MATERIALS,
    size: null,
    bottleSize: "Medium",
    weightG: null,
    galleryCount: 2,
  },
  {
    /* 旧カタログの Ai（MI-BAG-002）と同じ一本と見て、名前と URL を引き継いだ（紺の編み手・一升瓶の高さ）。 */
    slug: "ai-indigo",
    folder: "bottle-07",
    sku: "MI-BAG-007",
    name: "Ai",
    kanji: "藍",
    reading: "あい",
    line: "tatami-beri",
    priceAud: null,
    status: "coming_soon",
    note: "Moss, sky-blue and indigo bands beneath a hand-braided navy handle.",
    noteJa: "苔・空色・藍の縁に、紺の編み手。",
    story:
      "The tallest bag in the series — tall enough for a 1.8 L isshōbin of sake. Blue-green tatami-beri meets sky blue and deep indigo in one column, and the braided navy handle sits high so the bag hangs from the wrist.",
    storyJa:
      "連作でいちばん背の高い一本で、一升瓶が入ります。青緑の縁に空色と深い藍が一本の柱に集まり、紺の編み手は高めに付けて手首に掛かるようにしました。",
    materials: BOTTLE_MATERIALS,
    size: null,
    bottleSize: "Large",
    weightG: null,
    galleryCount: 4,
  },
  {
    slug: "aotake-green-bamboo",
    folder: "bottle-08",
    sku: "MI-BAG-008",
    name: "Aotake",
    kanji: "青竹",
    reading: "あおたけ",
    line: "tatami-beri",
    priceAud: null,
    status: "coming_soon",
    note: "Green, cobalt and black, with a pale woven handle. A small one.",
    noteJa: "緑・瑠璃・黒の縁に、淡い色の編み手。小さめの一本。",
    story:
      "A small bag in green, cobalt and black tatami-beri, with the paper band showing between every row. Photographed beside a wine bottle for scale.",
    storyJa:
      "緑・瑠璃・黒の縁に、段のあいだから紙バンドがのぞく小さめの一本。大きさはワインボトルと並べた写真でどうぞ。",
    materials: BOTTLE_MATERIALS,
    size: null,
    bottleSize: "Small",
    weightG: null,
    galleryCount: 2,
  },
  {
    slug: "nishiki-brocade",
    folder: "bottle-09",
    sku: "MI-BAG-009",
    name: "Nishiki",
    kanji: "錦",
    reading: "にしき",
    line: "tatami-beri",
    priceAud: null,
    status: "coming_soon",
    note: "Mint, red, green and cobalt — a sampler of the whole table.",
    noteJa: "薄荷・赤・緑・瑠璃。机の上の縁をひと通り。",
    story:
      "Almost every colour on the table that week went into this one: mint, two reds, green and a cobalt band at the base. The handle is wrapped in paper band with a thread of red.",
    storyJa:
      "その週の机にあった色をほとんど全部使った一本。薄荷、二つの赤、緑、裾に瑠璃。持ち手は赤をひと筋入れて紙バンドで巻いています。",
    materials: BOTTLE_MATERIALS,
    size: null,
    bottleSize: "Small",
    weightG: null,
    galleryCount: 1,
  },
  {
    slug: "matsuba-pine-needle",
    folder: "bottle-10",
    sku: "MI-BAG-010",
    name: "Matsuba",
    kanji: "松葉",
    reading: "まつば",
    line: "tatami-beri",
    priceAud: null,
    status: "coming_soon",
    note: "Pine-needle green with teal and grey, under a green handle.",
    noteJa: "松葉色に青緑と灰。持ち手も緑で。",
    story:
      "Dark pine green tatami-beri with teal diamonds and grey, wrapped close so little of the paper shows. The handle is wrapped in green to match.",
    storyJa:
      "青緑の菱が入った深い松葉色の縁を、紙がほとんど見えないほど詰めて巻きました。持ち手も緑で揃えています。",
    materials: BOTTLE_MATERIALS,
    size: null,
    bottleSize: "Small",
    weightG: null,
    galleryCount: 2,
  },
  {
    slug: "koke-moss",
    folder: "bottle-11",
    sku: "MI-BAG-011",
    name: "Koke",
    kanji: "苔",
    reading: "こけ",
    line: "tatami-beri",
    priceAud: null,
    status: "coming_soon",
    note: "Moss, sage and grey in narrow rows, under a pale woven handle.",
    noteJa: "苔・若竹・灰の細い段に、淡い色の編み手。",
    story:
      "Narrow rows of moss green, sage and grey tatami-beri, each patterned differently. Photographed beside a wine bottle for scale.",
    storyJa:
      "柄の違う苔色・若竹色・灰色の縁を細い段で重ねました。写真は大きさが分かるようワインボトルと並べています。",
    materials: BOTTLE_MATERIALS,
    size: null,
    bottleSize: "Small",
    weightG: null,
    galleryCount: 1,
  },
  {
    slug: "yoru-night",
    folder: "bottle-12",
    sku: "MI-BAG-012",
    name: "Yoru",
    kanji: "夜",
    reading: "よる",
    line: "tatami-beri",
    priceAud: null,
    status: "coming_soon",
    note: "Black-green and cream in a bold check, under a cream handle.",
    noteJa: "黒緑と生成りの大きな市松に、生成りの持ち手。",
    story:
      "The darkest check in the series: near-black green tatami-beri against cream paper band, with a cream handle. Tokiwa's smaller, darker sibling.",
    storyJa:
      "連作でいちばん暗い市松。黒に近い緑の縁と生成りの紙バンド、持ち手も生成りで。常磐を小さく、夜の色にした一本です。",
    materials: BOTTLE_MATERIALS,
    size: null,
    bottleSize: "Small",
    weightG: null,
    galleryCount: 2,
  },
  {
    slug: "beni-crimson",
    folder: "bottle-13",
    sku: "MI-BAG-013",
    name: "Beni",
    kanji: "紅",
    reading: "べに",
    line: "tatami-beri",
    priceAud: null,
    status: "coming_soon",
    note: "Crimson and dove grey with gold flowers, under a red handle.",
    noteJa: "紅と鳩羽鼠に金の花。持ち手は赤で。",
    story:
      "Crimson tatami-beri with gold flowers, alternating with a soft grey-pink band. A red-wrapped handle — a smaller companion to Akane.",
    storyJa:
      "金の花が入った紅の縁と、やわらかな灰桜の縁を交互に。持ち手は赤で巻いた、茜の小さな連れです。",
    materials: BOTTLE_MATERIALS,
    size: null,
    bottleSize: "Small",
    weightG: null,
    galleryCount: 2,
  },

  /* ---- Origami bags ------------------------------------------------------------ */
  {
    slug: "iroha-script",
    folder: "origami-01",
    sku: "MI-BAG-017",
    name: "Iroha",
    kanji: "いろは",
    reading: "いろは",
    line: "origami",
    priceAud: null,
    status: "coming_soon",
    note: "Charcoal with a band of white hiragana, edged in red.",
    noteJa: "炭色に白い平仮名の帯、縁取りは赤。",
    story:
      "Wide bands of tatami-beri folded like a sheet of origami: one flat square opens into a bag that stands on its own point. The white script is the iroha poem, running round the body.",
    storyJa:
      "幅広の畳の縁を折り紙のように折り、平らな一枚が自立するバッグになります。白い文字はいろは歌で、胴をぐるりと回ります。",
    materials: ORIGAMI_MATERIALS,
    size: null,
    weightG: null,
    galleryCount: 3,
  },
  {
    slug: "somei-cherry",
    folder: "origami-02",
    sku: "MI-BAG-018",
    name: "Somei",
    kanji: "染井",
    reading: "そめい",
    line: "origami",
    priceAud: null,
    status: "coming_soon",
    note: "Deep red with a band of white and red cherry blossom.",
    noteJa: "深い赤に、白と紅の桜の帯。",
    story:
      "Red tatami-beri with a centre band of cherry blossom, folded so the blossom spirals up to the handle. Lies flat when empty.",
    storyJa:
      "桜の帯が入った赤い縁を、花が持ち手へ螺旋を描くように折りました。空のときは平らに畳めます。",
    materials: ORIGAMI_MATERIALS,
    size: null,
    weightG: null,
    galleryCount: 3,
  },
  {
    slug: "uguisu-olive",
    folder: "origami-03",
    sku: "MI-BAG-019",
    name: "Uguisu",
    kanji: "鶯",
    reading: "うぐいす",
    line: "origami",
    priceAud: null,
    status: "coming_soon",
    note: "Charcoal with a band of olive-gold diamonds.",
    noteJa: "炭色に、鶯色と金の菱の帯。",
    story:
      "Charcoal tatami-beri with an olive-gold diamond band, folded into the same standing form as Iroha. The gold catches the light on the turn.",
    storyJa:
      "鶯色と金の菱が入った炭色の縁を、いろはと同じ自立する形に折りました。折り返しで金が光ります。",
    materials: ORIGAMI_MATERIALS,
    size: null,
    weightG: null,
    galleryCount: 2,
  },
  {
    slug: "sakuranezumi-cherry-grey",
    folder: "origami-04",
    sku: "MI-BAG-020",
    name: "Sakuranezumi",
    kanji: "桜鼠",
    reading: "さくらねずみ",
    line: "origami",
    priceAud: null,
    status: "sold_out",
    note: "Dove grey and pale pink hemp-leaf, the softest of the folds.",
    noteJa: "桜鼠と薄紅の麻の葉。折り紙でいちばん柔らかな色。",
    story:
      "Grey tatami-beri with a pale pink hemp-leaf band, folded into the standing origami form.",
    storyJa: "灰色の縁に薄紅の麻の葉の帯を合わせ、自立する折り紙の形に。",
    materials: ORIGAMI_MATERIALS,
    size: null,
    weightG: null,
    galleryCount: 2,
  },

  /* ---- Handbags ---------------------------------------------------------------- */
  {
    slug: "hishi-diamond",
    folder: "handbag-01",
    sku: "MI-BAG-015",
    name: "Hishi",
    kanji: "菱",
    reading: "ひし",
    line: "handbag",
    priceAud: null,
    status: "coming_soon",
    note: "Diamonds of green, indigo and gold hemp-leaf under a carved wooden handle.",
    noteJa: "緑・藍・金の麻の葉を菱に継ぎ、木彫りの持ち手を。",
    story:
      "Squares of tatami-beri — green, indigo, grey and a gold hemp-leaf — set on the diagonal and edged in red, so the bag reads as a field of diamonds. The carved wooden frame handle lets it open wide.",
    storyJa:
      "緑・藍・灰、金の麻の葉の縁を四角に切り、斜めに継いで赤で縁取りました。一面の菱に見えます。木彫りの口金の持ち手で、大きく開きます。",
    materials: [
      "Tatami-beri (tatami edging fabric), pieced and edged",
      "Carved wooden frame handle",
    ],
    size: null,
    weightG: null,
    galleryCount: 5,
  },
  {
    slug: "kago-basket",
    folder: "handbag-02",
    sku: "MI-BAG-016",
    name: "Kago",
    kanji: "籠",
    reading: "かご",
    line: "handbag",
    priceAud: null,
    status: "sold_out",
    note: "Woven like a basket in green and gold, with a drawstring lining.",
    noteJa: "緑と金の縁を籠のように編み、巾着の内袋を。",
    story:
      "Green and gold tatami-beri woven over and under like a basket, with two short handles and a green drawstring lining that closes over the top.",
    storyJa:
      "緑と金の縁を籠のように交互に編み、短い持ち手を二本。口は緑の巾着の内袋で閉じます。",
    materials: ["Tatami-beri (tatami edging fabric), woven", "Drawstring lining"],
    size: null,
    weightG: null,
    galleryCount: 3,
  },

  /* ---- Kimono shoulder bags ---------------------------------------------------- */
  {
    slug: "shima-stripe",
    folder: "kimono-01",
    sku: "MI-KIM-001",
    name: "Shima",
    kanji: "縞",
    reading: "しま",
    line: "kimono",
    priceAud: null,
    status: "coming_soon",
    note: "Navy and grey kimono stripes pieced into a crescent, with a navy strap.",
    noteJa: "紺と灰の着物の縞を三日月形に継ぎ、紺の肩紐を。",
    story:
      "Striped kimono cloth in navy, grey and brown, cut and pieced so the stripes change direction across the crescent. A long navy strap for the shoulder.",
    storyJa:
      "紺・灰・茶の縞の着物地を、三日月の上で縞の向きが変わるように継ぎました。肩に掛ける長い紺の紐付き。",
    materials: KIMONO_MATERIALS,
    size: null,
    weightG: null,
    galleryCount: 1,
  },
  {
    slug: "kon-navy",
    folder: "kimono-02",
    sku: "MI-KIM-002",
    name: "Kon",
    kanji: "紺",
    reading: "こん",
    line: "kimono",
    priceAud: null,
    status: "coming_soon",
    note: "Indigo with a patchwork of small prints, closed by a wooden button.",
    noteJa: "紺地に小紋を継ぎ、木のボタンで留めて。",
    story:
      "A round indigo body with a panel of pieced kimono prints — fine dots, small checks, a brown leaf — and a red piping along the curve. It closes with a wooden button and a loop strung with pearls.",
    storyJa:
      "丸い紺の胴に、細かな点・小さな格子・茶の葉の小紋を継いだ面を。曲線に赤いパイピング。木のボタンと、真珠を通した紐で留めます。",
    materials: [...KIMONO_MATERIALS, "Wooden button"],
    size: null,
    weightG: null,
    galleryCount: 1,
  },
  {
    slug: "kurumi-walnut",
    folder: "kimono-03",
    sku: "MI-KIM-003",
    name: "Kurumi",
    kanji: "胡桃",
    reading: "くるみ",
    line: "kimono",
    priceAud: null,
    status: "coming_soon",
    note: "Walnut brown pieced with slate blue and sand, with a brown strap.",
    noteJa: "胡桃色に青鈍と砂色を継ぎ、茶の肩紐を。",
    story:
      "Walnut-brown kimono cloth with curved panels of slate blue and sand, and a small floral patch at the opening. A long brown strap.",
    storyJa:
      "胡桃色の着物地に、青鈍と砂色の曲線の面を継ぎ、口元に小さな花柄を。長い茶の肩紐付き。",
    materials: KIMONO_MATERIALS,
    size: null,
    weightG: null,
    galleryCount: 1,
  },
  {
    slug: "yuhi-sunset",
    folder: "kimono-04",
    sku: "MI-KIM-004",
    name: "Yūhi",
    kanji: "夕日",
    reading: "ゆうひ",
    line: "kimono",
    priceAud: null,
    status: "coming_soon",
    note: "Taupe stripes with arcs of orange and red, on a braided strap.",
    noteJa: "灰茶の縞に、橙と赤の弧。編みの肩紐。",
    story:
      "Taupe striped cloth stitched in rows, with arcs of orange and deep red and a floral kimono panel at the mouth. The strap is braided.",
    storyJa:
      "縫い目を重ねた灰茶の縞に、橙と深い赤の弧、口元には花柄の着物地。肩紐は編んだものです。",
    materials: KIMONO_MATERIALS,
    size: null,
    weightG: null,
    galleryCount: 1,
  },

  /* ---- Aprons ------------------------------------------------------------------ */
  {
    slug: "hana-floral",
    folder: "apron-01",
    sku: "MI-KIM-005",
    name: "Hana",
    kanji: "花",
    reading: "はな",
    line: "apron",
    priceAud: null,
    status: "coming_soon",
    note: "Plain cream with a panel and pocket of flowered kimono cloth.",
    noteJa: "生成りの無地に、花柄の着物地の面とポケット。",
    story:
      "A cream apron with half its front cut from a flowered kimono in coral and blue, and a pocket of the same cloth on the plain side. Long ties.",
    storyJa:
      "生成りのエプロンの前の半分を、珊瑚色と青の花柄の着物地で。無地の側にも同じ布のポケットを付けました。紐は長め。",
    materials: KIMONO_MATERIALS,
    size: null,
    weightG: null,
    galleryCount: 1,
  },
  {
    slug: "ukiyo-print",
    folder: "apron-02",
    sku: "MI-KIM-006",
    name: "Ukiyo",
    kanji: "浮世",
    reading: "うきよ",
    line: "apron",
    priceAud: null,
    status: "sold_out",
    note: "White arrow-feather weave with a panel of figures on gold.",
    noteJa: "白い矢絣に、金地の人物柄の面。",
    story:
      "White arrow-feather (yagasuri) cloth, with half the front in a print of figures on gold, and a pocket cut to match.",
    storyJa: "白い矢絣の布に、前の半分は金地に人物を描いた布を。ポケットも揃えて。",
    materials: KIMONO_MATERIALS,
    size: null,
    weightG: null,
    galleryCount: 1,
  },
];

/**
 * slug でも旧 folder 名でも引く。**約束はここ一つ** —— `getProduct`・`lib/catalog.ts`・
 * カートがそれぞれ同じ比較を手書きしていた。`products` を参照しないので、client から
 * import してもカタログ本体はバンドルに入らない。
 */
export function findByKey<T extends { slug: string; folder: string }>(list: readonly T[], key: string): T | undefined {
  return list.find((p) => p.slug === key || p.folder === key);
}

export function getProduct(key: string): Product | undefined {
  return findByKey(products, key);
}

function folderOf(key: string): string {
  return getProduct(key)?.folder ?? key;
}

export function productImage(key: string, n: number): string {
  return leadSrc(folderOf(key), n);
}

/** folder 名から直に組む版。カタログを引かないので、client の部品（カート）はこちらを使う。 */
export function leadSrc(folder: string, n = 1): string {
  return `/images/products/${folder}/${n}.webp`;
}

export function productPath(product: Pick<Product, "slug">): string {
  return `/collection/${product.slug}`;
}

/* ------------------------------------------------------------------
   client に渡す形。**Product を丸ごと渡さない。**

   client の部品に渡した props は RSC ペイロードとして HTML に焼き込まれる。以前は
   カートに全九点の Product（物語の英日・素材・寸法）を渡していたので、どのページの
   HTML にも九点ぶんの物語が載っていた（2026-09-25 に計測）。部品が読む項目だけに削る。
   ------------------------------------------------------------------ */

/** カート（CartProvider / MiniCart）が読む分。 */
export type CartPiece = Pick<Product, "slug" | "folder" | "name" | "kanji" | "priceAud" | "status">;

export function toCartPiece(p: Product): CartPiece {
  return { slug: p.slug, folder: p.folder, name: p.name, kanji: p.kanji, priceAud: p.priceAud, status: p.status };
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

/** 値札。価格が未定なら null（呼ぶ側は何も出さない — 「TBA」を並べると売り場が空き家に見える）。 */
export function priceLabel(p: Pick<Product, "priceAud">): string | null {
  return p.priceAud == null ? null : aud.format(p.priceAud);
}

export function cm(v: number): string {
  return `${v} cm (${(v / 2.54).toFixed(1)} in)`;
}

/** カートに入れられるか。**価格が無いものは買えない** — 管理画面で Available にしても値段が先。 */
export function isPurchasable(p: Pick<Product, "status" | "priceAud">): boolean {
  return p.status === "available" && p.priceAud != null;
}
