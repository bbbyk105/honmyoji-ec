/**
 * ブランドのコピー・FAQ・創業者・法務表記。内容.txt（クライアント資料）を原典とする。
 * 英語を主、日本語を従（ページ内の副題・小見出し）— 日本語版ページは後日フェーズ。
 */

export const site = {
  name: "MIROKU",
  tagline: "Tatami-beri Bags from Honmyoji Temple",
  description:
    "One-of-a-kind bags handwoven at Honmyoji Temple in Fuji City, Japan, from tatami-beri remnants and recycled paper band. Made once. Made for you.",
  location: "Honmyoji Temple, Fuji City, Shizuoka, Japan",
  locationJa: "静岡県富士市 本妙寺",
  email: "hello@miroku.example", // TODO: 本番のメールアドレスに差し替え
  instagram: "https://www.instagram.com/", // TODO: 実アカウント URL
  nav: [
    { href: "/collection", label: "Collection", ja: "作品" },
    { href: "/about", label: "About", ja: "想い" },
    { href: "/blog", label: "Blog", ja: "手記" },
    { href: "/contact", label: "Contact", ja: "便り" },
  ],
} as const;

export const phrases = {
  madeOnce: { en: "Made Once. Made for You.", ja: "一度だけ作られる、あなたのためのバッグ" },
  noTwo: { en: "No Two Bags Are Alike.", ja: "同じバッグは、二つとありません" },
  shine: {
    en: "People and feelings can shine once more.",
    ja: "人も、物も、想いも　もう一度輝ける",
  },
  fabric: {
    en: "A Fabric Born from Japanese Tatami Culture",
    ja: "日本の畳文化から生まれた、美しい織物。",
  },
  oneOfAKind: { en: "One of a Kind", ja: "一点もの" },
  handmade: { en: "Handmade in Japan", ja: "日本の手仕事" },
} as const;

export const whyMore = {
  title: "Why is it more than just a bag?",
  titleJa: "なぜ、このバッグは少し特別な価格なのか。",
  en: [
    "This bag begins with materials that might otherwise be discarded.",
    "Each piece is carefully handmade at a temple in Japan, with time, craftsmanship and prayer woven into its creation.",
    "We do not want our bags to be something you use for a season and throw away.",
    "We want them to become something you reach for again and again — and eventually, something you cannot imagine letting go of.",
  ],
  close: "Made slowly. Made with care. Made to be loved for years.",
  ja: [
    "使われなくなれば、捨てられてしまうかもしれない畳の縁の端材。私たちは、それをもう一度、美しいものとして生まれ変わらせています。",
    "一つひとつ、お寺で人の手によって仕立て、完成したバッグには祈りを込めています。",
    "安く、たくさん作って、短い時間で役目を終えるものではなく。長く使うほど愛着が生まれ、いつまでも手放したくないと思ってもらえるものを。",
  ],
  closeJa: "時間をかけて。想いを込めて。末永く愛されるものを。",
};

export const pillars = [
  {
    key: "NATURE",
    ja: "富士山・四季",
    en: "Mount Fuji and the four seasons",
    body: "The temple sits at the foot of Fuji. Its light, its water and its bamboo grove are where the colours of each bag are chosen.",
  },
  {
    key: "CRAFT",
    ja: "畳の縁・着物・日本の手仕事",
    en: "Tatami-beri, kimono and Japanese handwork",
    body: "Every band is cut, woven and finished by hand. No machine could place a pattern the way a pair of hands does.",
  },
  {
    key: "CONNECTION",
    ja: "地域・人・ご縁",
    en: "Community, people and en — the ties between us",
    body: "The paper band is recycled in Fuji City. The edging is saved from local tatami makers. A bag carries those ties to wherever it goes.",
  },
] as const;

export type FaqItem = { q: string; qJa: string; a: string[]; aJa: string[] };

export const faq: FaqItem[] = [
  {
    q: "What is Tatami-beri?",
    qJa: "畳の縁（Tatami-beri）とは何ですか？",
    a: [
      "Tatami-beri is the decorative fabric edging traditionally used around Japanese tatami mats. It comes in a wide variety of colors, patterns and textures.",
      "We give this unique Japanese textile a new life by transforming it into handmade bags.",
    ],
    aJa: [
      "畳の縁（たたみべり）とは、日本の畳の端に施されている帯状の織物です。さまざまな色・柄・質感があり、日本の畳文化を彩ってきました。",
      "私たちは、この日本独自の織物に新しい命を吹き込み、手作りのバッグへと生まれ変わらせています。",
    ],
  },
  {
    q: "Is each bag completely handmade?",
    qJa: "バッグはすべて完全ハンドメイドですか？",
    a: [
      "Yes. Every bag is carefully crafted entirely by hand in Japan.",
      "Because each piece is handmade, you may notice slight differences in shape, stitching and finish. These are part of the character and beauty of handmade craftsmanship.",
    ],
    aJa: [
      "はい。すべて日本で、一つひとつ丁寧に人の手で制作しています。",
      "完全ハンドメイドのため、形・縫い目・仕上がりなどにわずかな違いが生じる場合があります。それこそが、機械による大量生産では生まれない、手仕事ならではの個性と美しさです。",
    ],
  },
  {
    q: "Is every bag one of a kind?",
    qJa: "すべて一点ものですか？",
    a: [
      "Yes. Each bag is individually made using available Tatami-beri materials.",
      "The color, pattern placement and combination may vary, so it is difficult to create two bags that are exactly the same. Once a one-of-a-kind piece is sold, it may never be reproduced.",
    ],
    aJa: [
      "はい。一つひとつ異なる畳の縁を組み合わせて制作しているため、基本的に一点ものです。",
      "色や柄の配置、組み合わせなどが異なるため、まったく同じバッグを二つ作ることはできません。一点もののため、売れてしまった作品は二度と同じものをお届けできない場合があります。",
    ],
  },
  {
    q: "Why is the price higher than an ordinary bag?",
    qJa: "なぜ一般的なバッグより価格が高いのですか？",
    a: [
      "Our bags are not mass-produced.",
      "Each piece requires time, careful handwork and attention to detail. We also make use of Tatami-beri remnants that might otherwise be discarded.",
      "Rather than creating inexpensive bags designed for short-term use, we hope to create pieces that you will love and use for many years.",
    ],
    aJa: [
      "私たちのバッグは、大量生産されたものではありません。",
      "一つひとつ時間をかけ、細部まで丁寧に手作業で仕上げています。また、本来であれば廃棄される可能性のある畳の縁の端材も大切に活用しています。",
      "安価に大量生産し、短い期間で使い終えるバッグではなく、長い年月をかけて愛着を持って使っていただけるものを作りたいと考えています。",
    ],
  },
  {
    q: "Why do you use Tatami-beri remnants?",
    qJa: "なぜ畳の縁の端材を使用しているのですか？",
    a: [
      "We use remnants and leftover materials whenever possible.",
      "By giving these materials a new purpose, we hope to reduce waste and create something beautiful and useful. From something that might have been discarded, to something made to be cherished.",
    ],
    aJa: [
      "私たちは、できる限り畳の縁の端材や残った素材を活用しています。",
      "本来なら廃棄されるかもしれない素材に新たな役割を与えることで、廃棄を減らし、美しく長く使えるものへと生まれ変わらせたいと考えています。捨てられるかもしれなかったものから、長く大切にされるものへ。",
    ],
  },
  {
    q: "Where are the bags made?",
    qJa: "バッグはどこで作られていますか？",
    a: [
      "Everything is handmade one by one at Honmyoji Temple in Fuji City, Shizuoka Prefecture, Japan.",
      "The temple is not only a place of worship, but also a place where traditional Japanese culture, craftsmanship and community come together.",
    ],
    aJa: [
      "すべて日本の静岡県富士市、本妙寺という寺院で、一つひとつ手作りしています。",
      "お寺は祈りの場であるだけでなく、日本の伝統文化や手仕事、人と人とのつながりが集まる場所でもあります。その場所から、日本の文化を感じていただけるバッグをお届けしています。",
    ],
  },
  {
    q: "Are the bags blessed or prayed over?",
    qJa: "バッグには祈りやご祈祷が込められていますか？",
    a: [
      "Yes. Each completed piece is offered a prayer at the temple.",
      "This is done with the wish that each bag will accompany its owner with peace, connection and good fortune in everyday life.",
    ],
    aJa: [
      "はい。完成したバッグには、お寺で一つひとつ祈りを込めています。",
      "そのバッグを持つ方の日々が穏やかで、人とのご縁に恵まれ、幸せな時間を過ごせますように――。そんな願いを込めてお届けしています。",
    ],
  },
  {
    q: "Will my bag look exactly like the photo?",
    qJa: "写真とまったく同じバッグが届きますか？",
    a: [
      "Because each bag is handmade and the Tatami-beri pattern may be positioned differently, the finished piece may have subtle variations from the photograph. This is what makes each bag uniquely yours.",
    ],
    aJa: [
      "完全ハンドメイドのため、畳の縁の柄の配置や仕上がりが、掲載写真と多少異なる場合があります。その違いもまた、手作りだからこそ生まれる個性です。世界に一つだけの、あなたのバッグとしてお楽しみください。",
    ],
  },
  {
    q: "Are the bags durable?",
    qJa: "バッグは丈夫ですか？",
    a: [
      "Tatami-beri is a durable textile originally designed for everyday use around tatami mats.",
      "However, the durability of each bag depends on its individual construction and how it is used. We recommend treating your bag with care and avoiding excessive weight.",
    ],
    aJa: [
      "畳の縁は、もともと日常的に使用される畳に用いられてきた、耐久性のある織物です。",
      "ただし、バッグの耐久性はそれぞれの仕立てや使用方法によって異なります。長くお使いいただくため、過度に重いものを入れたり、強い負荷をかけたりせず、大切にお取り扱いください。",
    ],
  },
  {
    q: "Can I wash the bag?",
    qJa: "バッグは洗えますか？",
    a: [
      "We generally recommend spot cleaning rather than machine washing.",
      "Please follow the care instructions provided with your individual bag, as the appropriate care method may vary depending on the materials used.",
    ],
    aJa: [
      "基本的には、洗濯機での洗濯ではなく、汚れた部分をやさしく拭き取るお手入れをおすすめしています。",
      "使用している素材によってお手入れ方法が異なる場合がありますので、商品に添付されているお手入れ方法をご確認ください。",
    ],
  },
  {
    q: "Can I order the same bag again?",
    qJa: "同じバッグをもう一度注文できますか？",
    a: [
      "Because our bags are one of a kind, we cannot guarantee that the same design can be reproduced.",
      "If you see a bag you love, we recommend purchasing it while it is available.",
    ],
    aJa: [
      "一点もののため、同じデザインを再制作できるとは限りません。",
      "「これが好き」と思えるバッグに出会ったときは、ぜひその出会いを大切にしてください。売り切れた作品は、二度と同じものに出会えないかもしれません。",
    ],
  },
  {
    q: "Can I order a custom-made bag?",
    qJa: "バッグはオーダーメイドも承れますか？",
    a: [
      "Yes. Use the contact form to tell us the shape, size, use and colours you have in mind. We will reply with a proposal, and once you agree on the design and price, we will make it for you.",
      "When an order is confirmed, we post a private listing for it in the online store and let you know. Please note that orders cannot be cancelled after payment, and that a custom piece takes time to make and ship — so please get in touch first.",
    ],
    aJa: [
      "はい。お問い合わせフォームから、イメージされている形・サイズ・用途・色味などをお教えください。こちらから提案し、デザインと価格に合意いただければオーダーメイドでお作りします。",
      "オーダーを承った際は、オンラインストア上に仮の商品ページを作成してお知らせします。決済後のキャンセル・クーリングオフはできかねます。お問い合わせから製作・発送までお時間をいただきますので、まずはご相談ください。",
    ],
  },
  {
    q: "Will the colors look exactly the same as on my screen?",
    qJa: "画面で見た色と実物は同じですか？",
    a: [
      "There may be slight differences due to your monitor, smartphone settings and lighting conditions.",
      "We photograph our products as accurately as possible, but handmade textiles can also have subtle variations in color and texture.",
    ],
    aJa: [
      "お使いのスマートフォンやパソコンの画面設定、撮影時の光の環境などにより、実物と写真の色味が多少異なって見える場合があります。",
      "また、手作りの織物ならではの色や質感の個体差もございますので、あらかじめご了承ください。",
    ],
  },
  {
    q: "What makes this bag special?",
    qJa: "このバッグの特別なところは何ですか？",
    a: [
      "It is more than just a bag. It brings together Japanese Tatami-beri, handmade craftsmanship, upcycled materials, temple culture, prayer and connection, and one-of-a-kind design.",
      "Each piece carries a small part of Japanese culture into everyday life.",
    ],
    aJa: [
      "このバッグは、単なるバッグではありません。日本の畳の縁、人の手によるものづくり、端材を生かすアップサイクル、お寺の文化、祈りとご縁、世界に一つだけのデザインが込められています。",
      "一つひとつのバッグが、日本の文化の一片を日常へ運んでくれます。",
    ],
  },
];

export const founder = {
  name: "Emi Kashiwazake",
  nameJa: "柏酒 英美",
  title: "Temple wife · Calligraphy artist · Japanese Culture & Craft Producer",
  titleJa: "寺庭婦人・書道クリエイター・和文化プロデューサー",
  timeline: [
    {
      years: "1995 –",
      en: "Calligraphy. More than twenty years with the brush, drawn to expressive art calligraphy rather than the orthodox school. Published by Maar-sha; commissioned company mottos and naming scrolls.",
      ja: "書道歴20年以上。幼少期から筆を持ち、正統派よりアート書道で自己表現する書が得意。マール社 書籍掲載、企業の社訓・命名書の実績。",
    },
    {
      years: "2021 –",
      en: "Kimono. Visited a kimono shop to understand the kimono sleeping in the family chest; learned to dress herself and others. Now proposes coordinates, plans events and produces kimono and accessories.",
      ja: "着物歴5年。箪笥の肥やしになっていた着物を理解するため呉服屋へ。着付けを習得し自装・他装が可能に。コーディネート提案・イベント企画運営・和小物のプロデュースへ。",
    },
    {
      years: "2023 –",
      en: "Married into a temple in Fuji City. Hosts kimono events and workshops at Honmyoji. In 2026, became a mother — and began producing the tatami-beri bags.",
      ja: "富士市のお寺へ嫁ぎ、お寺で着物イベントやワークショップを開催。2026年、一児の母となり、畳の縁バッグのプロデュースへ。",
    },
  ],
  origin: {
    en: [
      "Once I started wearing kimono, I began to notice the small things that go with it — and the traditional crafts behind them. I have always loved bags, so I wanted to produce one that belonged with kimono: kind to the earth, well designed, a little out of the ordinary, something that lifts your mood when you carry it.",
      "Then I learned that here in Fuji City, paper band is recycled from milk cartons and waste paper, and that tatami makers are left with offcuts of beautiful edging. Putting the two together, and producing every step myself, is how the tatami-beri bag was born.",
    ],
    ja: [
      "着物を着るようになってから、着物と親和性の高い小物や伝統工芸品に目が向くようになりました。特にバッグが好きだった私は、着物に合わせたバッグをプロデュースしたいと思い、環境に優しく、デザイン性があり、非日常も味わえて、持っていて気分が上がるようなバッグを探し求めていました。",
      "そこで、富士市の紙パックなどから再生された紙バンドと、端材となる畳の縁でバッグが作られていることを知り、私が全面プロデュースして、畳の縁バッグが誕生しました。",
    ],
  },
  reasons: {
    title: "Why paper band and tatami-beri remnants",
    titleJa: "紙バンド・畳の縁端材を選んだ理由",
    en: [
      "To give something back to Fuji City.",
      "The paper band is made from recycled milk cartons and waste paper — gentle on the environment.",
      "Tatami-beri offcuts appear every time a tatami room is made. Instead of being thrown away, they can stay in the world as one of Japan's beautiful crafts.",
    ],
    ja: [
      "富士市に貢献したいという想い。",
      "紙バンドの素材が古紙や牛乳パックから再生されていて、環境に優しいこと。",
      "畳の縁は畳の部屋を作る際に端材として出てくるもの。処分されずに、美しい日本の伝統工芸品の一つとして形を残していきたいから。",
    ],
  },
  handmade: {
    title: "Ichigo ichie — one encounter, one chance",
    titleJa: "一期一会",
    en: "Every bag is made entirely by hand in Japan, one at a time. Like the ties that bring each strip of tatami-beri to us, each finished bag has its own character — a slightly different colour, pattern, shape — that no machine could produce. Because it is handmade, it carries warmth, and becomes a bag you will meet only once.",
    ja: "日本で全て手作業で一本一本丁寧に作られ、畳の縁を紡ぐご縁と物語の始まりのように、完成したバッグはそれぞれ個性を持って息を吹き返します。色、柄、形、そのすべてに少しずつ違いがあり、機械では生み出せない、このバッグだけの個性です。ハンドメイドだからこそ温もりを感じ、またとして出会えない『一期一会』のバッグになります。",
  },
  message: {
    en: "By carrying this bag in your everyday life, I hope you will feel the culture, the craft and the beauty that have been handed down in Japan — and that somewhere, through this bag, we will have the chance to meet.",
    ja: "このバッグを日常に身につけることで、受け継がれてきた日本の文化や職人の技、美しさを実感していただき、この畳の縁バッグを通じてまたどこかでお会いするきっかけになればと思っております。",
  },
};

export const legal = {
  seller: "MIROKU",
  address: "1254-2 Nakazato, Fuji City, Shizuoka, Japan",
  addressJa: "静岡県富士市中里1254-2",
  phone: "+81 80-3470-1863",
  responsible: "Emi Kashiwazake（柏酒 英美）",
  price: "From A$150. All prices are shown in Australian dollars (AUD) and include Japanese consumption tax.",
  shipping:
    "Standard international shipping is included in the price. If you need express delivery, contact us before ordering; the difference will be invoiced separately.",
  payment: "Credit card via Stripe. Payment is taken in full at checkout.",
  delivery:
    "Pieces in stock ship within one month of your order. Custom-made pieces take longer; we will give you a date when the order is agreed.",
  returns: {
    title: "Returns & Refund Policy",
    titleJa: "返品・返金について",
    sections: [
      {
        h: "1. Our products",
        p: "Every piece is handmade and one of a kind. Small differences in shape, stitching, pattern placement and colour from the photographs are part of the work, not defects, and are not grounds for return.",
      },
      {
        h: "2. Cancellation",
        p: "Because each bag is reserved for you the moment you pay, orders cannot be cancelled or refunded after payment, including custom-made pieces. The Japanese cooling-off system does not apply to online sales.",
      },
      {
        h: "3. Damaged or wrong item",
        p: "If your bag arrives damaged, or is not the piece you ordered, photograph it and contact us within 7 days of delivery. We will repair, replace where possible, or refund in full, and cover the return shipping.",
      },
      {
        h: "4. Reserved pieces",
        p: "A piece marked Reserved is being held for a customer who has contacted us. If payment is not completed within a few days, it returns to Available.",
      },
    ],
  },
};
