<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MIROKU（honmyoji-ec）— プロジェクト知識

## 概要

静岡県富士市・本妙寺で作られる「畳の縁バッグ」の EC サイト（Next.js 16 App Router + Tailwind v4）。
販売者名は **MIROKU**、英語メイン・日本語サブ（日本語版ページは後日フェーズ）。価格は AUD（オーストラリアドル）固定表示。
クライアント資料の原典は `内容.txt`（SKU 体系・FAQ・創業者略歴・特商法・ブランドコピー）。

## 構成

- `DESIGN.md` — 視覚言語の正本。UI を触る前に読む。
- `data/products.ts` — **商品カタログの正本**。寸法・素材・写真の枚数・SKU はここを編集する。価格とステータスと文言は `/studio` から上書きできる（上書きが無ければここの値が出る）。読むときは `data/products.ts` ではなく `lib/catalog.ts` を通すこと。
  - **2026-09-25 にカメラマン撮影分（26 点）へ入れ替えた**。旧九点は Ai（`ai-indigo`＝今の `bottle-07`、同じ一本と判断）を除いて一覧から外れ、旧 URL は `next.config.ts` で `/collection` へ一時リダイレクト。**名前・一言・物語は写真から付けた仮**、寸法は未計測（`size: null`）。正式な文言が届いたら差し替える。
  - カテゴリ（`ProductLine`）は五つ: `tatami-beri`（ボトルバッグ・大中小）/ `origami`（折り紙バッグ）/ `handbag` / `kimono`（着物地のショルダー）/ `apron`。主役写真の比率は区分で決まる（`LINE_RATIO` — 立つものは 4:5、横に広いもの・平置きは 3:2）。一覧は区分ごとの節で組む（`LINE_ORDER`・`LINE_BLURB`）。
  - `folder` はクライアントの書き出し番号（`bottle-01` … `bottle-13`、`bottle-05b`、`origami-01` …）。**名前が変わっても folder は変えない** — 写真の置き場所とモーフ名（`bag-{folder}`）がこれに付いている。SKU も書き出し番号に合わせてある（`MI-BAG-001` = バンブー中1）。
  - **価格は未定なら `priceAud: null`**。表示は `priceLabel()`（null なら何も出さず状態だけ）。`isPurchasable()` は `available` かつ価格ありのときだけ真 —— 管理画面で Available にしても、価格を入れるまでカートにも Stripe にも入らない。
  - ステータス（`ProductStatus`）は五つ。`made_to_order` は「写真の一点は出たが、同じ形を別の色で作り直せる」もの。**ステータスを増やしたら六箇所を直す**: `data/products.ts` の型と `STATUS_LABEL` / `lib/catalog.ts` の `STATUSES` / `components/collection/StatusPill.tsx` / `app/(site)/collection/[slug]/page.tsx` の `cta()` / `app/studio/options.ts` / `app/studio/page.tsx` の `PIECE_ORDER`。`Record<ProductStatus, …>` にしてある三箇所は `tsc` が教えてくれるが、`cta()` は黙って落ちる。
  - 買えるのは `available`（カート → Stripe）だけ。`made_to_order` は色を決める会話が要るのでカートに入れず、Contact（`subject=colour`）へ送る。
- `data/site.ts` — ブランドコピー・FAQ・創業者・特商法/返品ポリシー。
- `data/blog.ts` — Blog の**型とフォールバックの種**。記事本体は microCMS（下記）。ここは鍵の無い環境で Blog が空にならないようにするための seed で、記事を足す場所ではない。
- `lib/microcms.ts` — **Blog の記事はここから来る**。入稿の手順・スキーマ・Webhook は `docs/microcms.md`。
- `components/blog/BlogArticle.tsx` — 記事の組み。`/blog/[slug]`（公開）と `/blog/preview`（下書き）で共有する。**版面（980px）と行長（`--blog-measure` = 580px ≒ 70 文字）は別物** — 文章は measure で止め、写真だけが版面いっぱいに出る。両方 980px にすると 1 行 119 文字になる（2026-09-20 に直した）。`ch` で共有しないこと：見出しと本文の書体で `0` の幅が違うので、同じ `62ch` でも右端が揃わない。
- `components/blog/ArticleToc.tsx` — 記事の目次。版面の右の余白に絶対配置＋sticky、`xl` 以上・**見出し三つ以上**のときだけ。見出しは `[data-article-body]` の `h2` を**描かれた DOM から**拾う（本文は microCMS のリッチエディタ HTML と手書きブロックの二系統で、揃うのは描画後だけ）。id は CMS が振っていればそれを使い、無ければ見出しの文字から作る（`lib/heading-id.ts`）。現在地は `useScrollSpy`（トップの章のレールと共通）、送りは `scrollToChapter()`。
- `app/(site)/` — 公開サイト。`/` `/collection` `/collection/[slug]` `/about` `/blog` `/blog/[slug]` `/blog/preview` `/faq` `/legal` `/contact`（Server Action）`/checkout/thank-you`。**route group なので URL には `(site)` は出ない** — 外枠を `/studio` と分けるためだけの括り。
- `app/studio/` — **管理画面**（一般には見えない）。商品の価格・ステータス・文言と、Stripe の注文。手順と設計は `docs/studio.md`。
- `app/api/` — `revalidate`（microCMS Webhook）と `stripe/webhook`（決済の確定）。
- `app/layout.tsx` は html / body / フォントだけ。**ヘッダーやフッターをここに戻さない** — 親 layout は子から外せないので、`/studio` にサイトの外枠が付いてくる。公開サイトの外枠は `components/site/SiteChrome.tsx`（`app/(site)/layout.tsx` と `app/not-found.tsx` が共有する。404 は route group の layout を通らない）。
- `lib/catalog.ts` — **商品の読み口はここ一つ**。`data/products.ts` に DB のオーバーレイを重ねて返す。公開ページで `products` を直接 import しない（管理画面で直した値が反映されなくなる）。`getCatalog()` / `getPiece()` / `getPieces()`。`import "server-only"` 付き（`lib/microcms.ts` / `supabase.ts` / `stripe.ts` / `orders.ts` も同じ）— client から import するとビルドで止まる。
- `proxy.ts` — Next 16 で `middleware.ts` から改名。`/studio/*` の `noindex` ヘッダーと、cookie の無い訪問者をログインへ返す処理。**認可の本体はここではない**（Edge に node:crypto が無い）— 検証は `lib/studio-session.ts` の `requireSession()` で、ページと Server Action が毎回通る。
- `components/collection/Lightbox.tsx` — **写真を一枚で開くビューア**。`LightboxProvider` で囲み、`Zoomable index={n}` で `Frame` を包むと押せるようになる（`Frame` は Server Component からも使うので、onClick を生やさず透明な button を上に被せている）。当たり判定の本体は `ZoomHit` — Provider が無い場所では何も出さないので、Server Component の `ProductHero` もこれを置くだけ。**ビューア本体は `LightboxViewer.tsx` に分けて `next/dynamic` で遅延読み込み**（写真を開かない人の初回 JS に載せない。idle で先読みはする）。倍率と位置の計算は `lib/pan-zoom.ts`（純粋関数・テストあり）。**通し番号は 0 がヒーローの像、1 以降がギャラリー**。`GalleryStrip` には `offset={1}` を渡してずらす。地は開いたページの面と同じ（商品ページは紙なので紙。`bg-sumi` がトークンで入れ替わる）— 一枚だけ別の明るさの部屋に持っていくと、そこだけ別のサイトになる。ホイール（カーソルの下を中心に）／ピンチ／＋− でズーム、拡大中は掴んで移動、等倍で横に払うと隣へ、下のバーの `← 01 / 06 →` とサムネイルで送れる、Esc で閉じる。**送りの矢印を写真の上に浮かせない** — stage が `setPointerCapture()` を取るので、押しても click が来ず反応しない（実際に踏んだ）。背後のスクロールはカートと同じ `useScrollLock`。
- **倍率と位置は一つの state に持つ**（`Lightbox.tsx` の `view`）。別々の `useState` にして倍率の updater の中から位置の setState を呼ぶと、React が updater を二度走らせる開発時に位置だけ二重に適用され、掴んだ点から倍ずれる（実際に踏んだ）。updater は純粋に保つこと。
- `components/collection/GalleryStrip.tsx` — **スマホのギャラリー**（`md:hidden`）。snap の横スワイプ + `01 / 05` カウンタ。写真1枚の作品は自動で普通の一枚に落ちる。md 以上は**撮ったままの比率の二段組**（CSS columns。縦 5:8 と横 8:5 が混ざるので、行で組むと縦が一枚余ったときに半分が空く）。比率は `data/image-sizes.json`（`prepare-photos.py` が書く）から引く — 実行時に `fs` で `public/` を読まない。
- `components/collection/PieceTile.tsx` — **作品の一枚。一覧・トップ・関連作品は全部これ**（2026-09-25 にカットアウトの展示台 `FloatingBag` / `StillTile` / `CollectionStudio` から置き換えた）。**写真 → 名前 → 価格か状態の三段だけ**（一言の説明は既定で出さない。`showNote`）。枠・影・地の板を持たない。hover は井戸の中で 2% 寄るだけ。一覧の格子と関連作品は `reveal="none"`（二十六枚が順に開く演出にしない）。写真はカメラマンの撮影そのままで、立つ作品は 4:5 に**背丈を揃えて**切ってある（同じ床・同じ障子の前に並ぶので、一列が一つの部屋に見える）。`bag-{folder}` で `ProductHero` へモーフする（同じ写真・同じ比率）。価格が無いものは右に状態（`StatusPill`）を出す。`SoldBand.tsx` — 完売の帯（写真の縦中央に罫と `Sold out`、写真は 45% に落とす）。**URL slug（`/sakura-cherry`）を画面に出さない** — 2026-09-01 に `PieceSlug` ごと外した。
- `components/site/Shell.tsx` — **版面の定数 `SHELL`**（`max-w-[1480px]` + 左右余白）。ヘッダー / フッター / ヒーロー / トップの全セクションがこれを使う。新しいセクションで `mx-auto max-w-... px-...` を手書きしない — 手書きに戻すと必ず 16px ずれる。
- `components/site/Frame.tsx` — 写真井戸。`data-image-role` / `data-image-ratio` 属性付き。差し替えは `src` だけ。`aspect`（数値）を渡すと撮ったままの比率で置く。**公開ページの写真に `caption` を付けない**（2026-09-25。「Corridor, Honmyoji」「Ai · detail」のような 9.5px 大文字の添え書きが一番テンプレートらしく見えていた）— `caption` は Blog の本文の画像説明だけに残してある。
- `components/cart/` — Cart（localStorage）と MiniCart。決済は Contact へ手渡し。slug と旧 folder 名の両方を `findByKey` で解決する（計算は `lib/cart.ts`、テストあり）。カタログは `SiteChrome` がサーバーで引いて `CartProvider` に `CartPiece`（カートが読む項目だけ）で渡し、MiniCart は `useCart().pieces` を描く。写真は `leadSrc(folder)` で組む（`productImage(slug)` はカタログ本体を引くので client から使わない）。`InquiryCta` は Server Component で、client に降りるのは `HoldButton`（slug だけ）。**表示は Cart だが localStorage キーは `miroku-held` のまま**（変えると既存のカートが空になる）。UI 上の「Hold / Held」は 2026-08-31 に全て Cart 系の語へ置換済み。
- `components/site/` — Header（GSAP ハンバーガー, viewTransitionName=site-header）/ Footer / Reveal（ScrollTrigger）/ BeriBand / Newsletter。**Button は全ページ共通で二種類だけ**（2026-09-25）: `solid`（買う・送る・知らせてもらう —— お金か連絡先が動く一つだけ）と `link`（語・罫・矢印。既定）。罫で囲った四角（旧 `outline`）は廃止。矢印は字の「→」ではなく `Arrow.tsx`（1px の線）。CTA を新しく置くときは素の `<Link className="link-line">` ではなく Button を使う — `link-line` は hover で初めて罫が出るので、CTA には弱い。
- `components/motion/` — Lenis + GSAP 登録。`SmoothScroll` がルートを包む（インスタンスを作るだけ）。止める・動かす・章へ送るは `components/motion/lenis.ts`（`stopLenis` / `startLenis` / `scrollToChapter`）— Lenis 本体を import しない小さな窓口。章の送りは Lenis があれば Lenis に頼む（ネイティブ smooth と慣性は引っ張り合う）。「動きを減らす」の判定は `prefersReducedMotion()`（`reduced-motion.ts`）— `matchMedia` を手書きしない。
- `hooks/` — 部品をまたいで繰り返す処理。`useSurfaceAt(y)`（画面の高さ y の下が紙の面か。`fixed` の部品が字の色を合わせる）/ `useScrollLock(active)`（背後を止める。**数えて止める** — 最後の一人が離れたときだけ外れるので、メニュー→カートの受け渡しでも外れない。命令的に使うなら `lockScroll()` が外す関数を返す）/ `useWindowEvent(type, handler, { enabled })`（handler は `useEffectEvent` で最新を読むので、state が変わっても付け直さない）/ `useScrollSpy(ids, start)`（いまどの節か。`null` の節は監視しない）。メニュー・カート・ビューアで `body.style.overflow` や Lenis を直に触らないこと。
- `components/motion/EntryCurtain.tsx` — **入場の幕**。同じセッションで一度だけ（`sessionStorage` の `miroku-entered`）。開き方は**二枚が左右へ退く**（上へ滑らせない — サイト中の所作が全部同じ向きになると安く見える。2026-09-20）。合わせ目にだけ ivory の罫を引く。**「もう見たか」は `SiteChrome` が body 先頭に置く一行の script が塗る前に決める** — mount 後の effect で判定すると、二度目以降に一瞬だけ幕が見える。その代償として `app/layout.tsx` の `<html>` に `suppressHydrationWarning` が要る（サーバの HTML に `data-entered` が無いので、無いと毎回 hydration mismatch が出る。実際に踏んだ）。
- `components/motion/PageTransition.tsx` — **ページの移り変わり**。見た目は `app/globals.css` の `::view-transition-*(.page)`（前のページが退き、新しいページが中央から左右へ開く）。この部品は「モーフかどうか」の印を `html` に置くだけ。**`main` は `SiteChrome` で `<ViewTransition default="page">` に包んである** — React は `<ViewTransition>` が関与する更新でしか遷移を開始しないので、包まないと CSS が一度も走らない（包む前は作品のモーフ以外で死んでいた）。`data-morph` が付いた導線（`Button` は `morph` prop）では地を静かに入れ替えるだけにする。**`html[data-morph]::view-transition-old(…)` に空白を入れないこと** — 疑似要素は html の子孫ではなく html 自身に付くので、子孫結合子だと一つも一致せず、モーフの下で版が開き続ける（実際に踏んだ）。
- `components/motion/momentum-guard.ts` — **遷移をまたいで届くトラックパッドの慣性を捨てる**。macOS は指を離したあとも 1 秒ほど wheel を送るので、一覧を流しながら作品を押すと、先頭へ跳んだ直後に前のページの慣性で新しいページが 2000px 流れていた（2026-09-25 に報告・再現）。`SmoothScroll` が遷移ごとに `arm()` し、wheel が 150ms 途切れるまで window の捕捉フェーズで握りつぶす（Lenis に渡さない）。**検証で wheel を `window` に dispatch しないこと** —— window が target だと Lenis の方が先に受けるので、効いていないように見える。実際の wheel と同じく要素に投げる。
- `components/motion/view-transition-guard.ts` — **裏のタブで飛ばされた View Transition をエラーにしない**。Chrome はタブが裏にあると遷移を飛ばし `ready` を "Transition was aborted because of invalid state. Document hidden" で reject するが、React は無視する文言を完全一致で見ているので末尾の ". Document hidden" ですり抜け、dev では画面いっぱいのエラーになる（2026-09-25 に踏んだ。dev サーバのファイル変更で画面が差し替わった瞬間、プレビューのタブが裏にあった）。`PageTransition` が起動時に `document.startViewTransition` を包み、`ready` の拒否理由だけを React が知っている文言に揃える。挙動は変えない。React が前方一致に直したら外せる。
- `components/site/CursorMark.tsx` — **カーソルに灯る語**。`data-cursor="View"` / `"Zoom"` を持つものの上だけ（`PieceTile` のリンクと `Lightbox` の `Zoomable`・商品ページのヒーロー）。`lg` 以上かつ `pointer: fine` のときだけ。**`gsap.killTweensOf(el)` を使わないこと** — 追従を持っている `quickTo` のトゥイーンごと死に、語は出るのに印が画面の左上から動かなくなる（実際に踏んだ）。重なりの解決は `overwrite: "auto"` で。
- `components/site/ChapterRail.tsx` — **章の柱**。番号は `app/(site)/page.tsx` の `CHAPTERS` が持ち、`id` は各 `<section>` と一致させる（**節を足したら両方直す** — id の無い章は黙って飛ばされる）。ヒーローは sticky で ScrollTrigger が測れないので監視せず、「二つ目より上なら一つ目」で決める。**表紙にいるあいだは引く**（第一画面には縦組みと `01 — Honmyoji` が既にあり、重ねると 01 が二つ並ぶ）。
- `components/site/ImageWell.tsx` — 写真の「開き方」。`Frame` / `PieceTile` の井戸はこれ。`wipe`（既定）と `band`（中央から左右へ・ヒーローのみ）。マスクは井戸ではなく内側の層に掛かるので、上に載せた見出しは開いている間も動かない。
  - **開く向きは `from`**（`bottom` / `left` / `right` / `top`）。**写真が版面のどの端に着いているかで決める** — 並んだ二枚が互いに向き合って開く。隣り合うときは `revealDelay` でずらす（同時に開くと一組の仕掛けに見える）。
  - **像の倍率は動かさない**（2026-09-20）。動くのはマスクの端と、4% 遅れて追いつく平行移動だけ。倍率 1.06 は平行移動で端が欠けないための余白なので、**クラスではなく effect で置く** — クラスで固定すると、写真の無い空の井戸の四辺の罫が枠の外へ出て消える。
  - **`Reveal` は井戸を含むブロックをフェードさせない**（キャプションだけ動かす）。写真と文章を一つの `Reveal` に同居させないこと — 同居すると文章が素で現れる。
- `components/site/DriftBand.tsx` — 縦スクロールに紐付けて横に流れる写真の帯。自走マーキーにはしない。**並べるのはバッグが主役の写真だけ**（風景・堂内のカットは入れない）。写真は一本の床に揃える（上下に段違いにしない）。トップでは `bridge` で墨と紙の境目にまたがらせ、面の切り替わりを縞にしない。
- 価格の表記は `data/products.ts` の `aud` ひとつ（`A$220`）。ロケールを `en-AU` にすると記号が素の `$` に戻り、どの国のドルか分からなくなる。値段の隣に通貨名を書き足さない（記号が言っている）。
- 商品 URL は読みやすい複合 slug（`tokiwa-evergreen`）。画像フォルダは `folder`（`bottle-01`）。旧カタログの URL は `next.config.ts` で `/collection` へ（一時リダイレクト）。

## 画像パイプライン（重要）

- **商品と着姿はカメラマン撮影分**（2026-09-04 撮影）。原稿は `image/*.png`（クライアントの書き出し・3024×1964・計 500MB 超）で **git 管理外**。サイトからは参照しない。
- `scripts/prepare-photos.py` が原稿 → `public/images/products/<folder>/{1..n}.webp`・`scenes/*.webp`・`texture/weave-*.webp`・`data/image-sizes.json` を作る。
  - 実行: `.venv/bin/python scripts/prepare-photos.py`（`--only products --product bottle-07` で一点だけ、`--only scenes` / `--only textures` も可）。依存は下の `prepare-images.py` と同じ .venv。
  - **原稿はスクリーンショット**で、上端（横位置）か左端（縦位置）に 29 / 66px の黒帯が乗っている。`trim_bars()` が落とす。帯には時計などメニューバーの字が乗っているので、**「ほぼ全画素が黒い行」で判定する**（平均・標準偏差で見ていた頃は字の行で止まり、33 枚に 37px の黒帯が残っていた。墨の地では見えず、紙の地で線として見えた。2026-09-25）。
  - **縦位置の PNG には古い EXIF Orientation=8 が残っている**（画素はもう正しい向き）。タグを連れたまま rembg に渡すと 90° 倒れたマスクが返ってくるので、`load()` で画素だけにしてから使う（実際に踏んだ）。`バンブー小11` と着姿の `0.03.31`（→ `scenes/altar-close`）は画素そのものが倒れているので `rotate: 90`。
  - 主役（`1.webp`）は区分で切り方が違う: 立つもの（ボトル・折り紙）は背景除去で作品の外接矩形を取り、**背丈が枠の 84%・接地線が上から 94%** になるよう 4:5 に切る。縦位置しか無い二点（中6・小9）は幅が足りないので左右を**鏡映しで**足す（引き伸ばすと壁の肌理が縞になる）。横に広いもの・平置きはカメラマンの画角のまま 3:2。`data/products.ts` の `LINE_RATIO` と揃えること。
  - 背景除去は位置決めだけなので **isnet-general-use**（birefnet と外接矩形が 1px しか違わず、1 枚 2 分 → 1.4 秒）。出力は写真のまま。
  - 書き出し名の対応（大7 と 大 は同じ一本、中5 には緑と青の二本がある 等）は script の `PRODUCTS` の註に書いてある。
- `scripts/prepare-images.py` は旧カタログ（iPhone 原本 `public/本妙寺*/`・git 管理外）用。今は寺の風景（fuji / water-basin / temple-hall / statue-mono）と BeriBand 用の縁のテクスチャを作り直すためだけに残している。**`--only textures` 以外で回すと、消した旧作品の写真が戻ってくる**。
- **外部の写真は `public/images/stock/` だけ**（2026-09-25〜）。トップの「Tatami」の節（畳とは何か）の二枚と About の富士山（fuji-dusk）は Unsplash（Unsplash License: 商用可・表記任意・単体での転売不可）。出典・撮影者・元ページは `prepare-photos.py` の `STOCK` にあり、`--only stock` で取り直せる。**作品と寺の写真には使わない**（トップの「Every photograph of the bags was taken at Honmyoji」が嘘になる）。alt にも本文にも本妙寺の写真だとは書かない。
- **切り出しは掲載する比率と同じ比率で**。`weave-moegi` は 4:5（home /material・blog リード）。横長の原稿を 4:5 の井戸に入れると object-cover で削られた分だけ実効解像度が落ち、拡大されて荒れる。掲載側にも `max-w` を付けて、原稿以上の大きさを要求しないこと。
- **画像を差し替えたら `.next/dev/cache/images` を消す**。`_next/image` の最適化結果は Next 16 ではここに残る（`.next/cache/images` ではない）。原本を差し替えても `X-Nextjs-Cache: STALE` のまま古いバイト列を返し続け、再検証もされない。しかも srcset の幅ごとに別エントリなので、`w=1080` は新しいのに `w=640` だけ古い、という混ざり方をする（2026-09-17 に踏んだ。九点の背丈を揃えたのに一覧がばらばらに見えたのがこれ）。**dev server を再起動するだけでは直らない** —— 起動時にディスクの内容を読むので、止める → 消す → 起動する、の順でないと同じ像が戻ってくる。
  ```bash
  pkill -f "next dev"; rm -rf .next/dev/cache/images .next/cache/images; npm run dev
  ```
  ブラウザ側にも残るので、直ったか見るときはハードリロード（⌘⇧R）する。確認は curl が早い —— 返ってきた webp の寸法が `data/image-sizes.json` の比率と合っていれば新しい。
  ```bash
  curl -s -H 'Accept: image/webp' 'http://localhost:3000/_next/image?url=%2Fimages%2Fproducts%2Fbottle-07%2F1.webp&w=640&q=75' | file -
  ```

## View Transitions（一覧 → 詳細のモーフ）

- React の `<ViewTransition name={`bag-${folder}`} share="morph" default="none">` を一覧カードと詳細ヒーローの両方の `<Image fill>` に付けている（URL slug が変わってもモーフ名は安定）。Next 16 では設定不要（`experimental.viewTransition` は不要）。
- CSS は `app/globals.css` の `::view-transition-*(.morph)`（720ms、途中ブラー）。ヘッダーは `site-header` 名で固定。
- `default="none"` を外すと無関係な遷移でも毎回クロスフェードする。`share` を外すとモーフしなくなる。
- 動作確認済み: クリック時に `::view-transition-group(bag-sakura)` が生成される（folder 名）。
- **Lenis** と `html { scroll-behavior: smooth }` は共存しない。smooth は `auto` のまま。
- GSAP は `"use client"` + `useGSAP`（`@gsap/react`）。`prefers-reduced-motion` では Lenis / 入場アニメを止める。
- 見出しを行マスクで起こしたいときは `<Reveal>` の中の `h2` に `data-split-lines` を付けるだけ（`Reveal` が SplitText を張って cleanup で revert する）。
- **動きの参照元は cellato.tokyo**。ただし借りるのは所作（マスクで開く／行マスク／スクロール連動の横帯）だけで、黒地・ピル型ボタン・中央CTAは DESIGN.md が明示的に否定しているので持ち込まない。
- ハンバーガーは `xl:` 未満。2本線→X と clip-path ワイプは GSAP。CSS の rotate で代用しない。
- **メニューの閉じ方は二種類**（`closeMode`）。行き先を選んだとき（ナビ項目 / ワードマーク / Cart / 戻る進む）は `instant`、閉じるだけのとき（X / Esc）は `reverse` を 2 倍速で。`tl.reverse()` を等速で回すと 1.19 秒かかり、61ms 後に始まる View Transition がヘッダーを固定するので、新しいページの上にメニューが乗ったまま止まって見える。
- `SiteHeader` の GSAP effect の deps は `open` **だけ**。`closeMode` を足すと、カートを開くとき（`open` は false のまま）に閉じる側の所作が再実行される。（以前はここでスクロールも外していて `MiniCart` のロックを打ち消していた。いまは `useScrollLock` が数えて止めるので構造的に起きない。）

## microCMS（Blog）

- 記事は microCMS のリスト API `blogs`。**コンテンツ ID がそのまま URL**（`/blog/<コンテンツID>`）。入稿・スキーマ・Webhook の手順は `docs/microcms.md`。環境変数の一覧は `docs/studio.md`（`.env.example` は Claude の権限設定で書けないため更新されていない）。
- `MICROCMS_SERVICE_DOMAIN` / `MICROCMS_API_KEY` が無い環境（ローカル・プレビュー）と、API が落ちたときは `data/blog.ts` の seed に落ちる。**CMS 未設定でサイトが 500 になる作りにしない** — ログは `[microcms]` で出る。
- 一覧は 1 リクエスト（最大 100 件）。詳細ページもその一覧から引く（記事ごとに叩かない）。並びは掲載日の新しい順。
- 本文はリッチエディタの HTML を `.blog-prose`（`app/globals.css`）で組む。手書き記事のブロック（`p` / `h` / `image`）と同じ寸法に合わせてあるので、CMS 側で色や文字サイズを付けない。
- 反映は Webhook（`/api/revalidate`、`X-MICROCMS-Signature` を検証して `revalidateTag("blog")`）＋ 10 分の定期再検証。
- 下書きは `/blog/preview?slug=…&draftKey=…`（`force-dynamic`・noindex・画面下に帯）。**コンテンツ ID に `preview` は使えない**。
- microCMS の画像は `next.config.ts` の `remotePatterns`（`images.microcms-assets.io`）を通る。

## 管理画面と決済（詳細は `docs/studio.md`）

- 商品カタログの正本は `data/products.ts` のまま。DB (`piece_overrides`) に置くのは管理画面から動かす値（価格・ステータス・一言・物語）だけで、**行が無ければコード側の値が出る**。鍵が無くても DB が落ちてもサイトは今日と同じ姿で立つ。
- 写真の枚数・寸法・SKU は DB に持たない。写真の差し替えとセットでしか変わらないので、管理画面から触れても写真が付いてこない。
- 注文が確定するのは **Stripe Webhook だけ**。`/checkout/thank-you` では作らない（カードは通ったのに客がタブを閉じた、で注文が消える）。Webhook は保存に失敗したら 500 を返して再送させる。
- 決済が通ると Webhook が作品を自動で `sold_out` にする。一点物なので、手作業にすると二人目に買える状態で見える時間ができる。
- Stripe に商品を登録しない。毎回 `price_data` でその場に組む（価格の正本が二つになると必ずどちらかが古くなる）。
- 管理画面の日本語は `ch` で測らない。`max-w-[62ch]` は和文だと 20 字ほどで折り返す（DESIGN.md の Measure と同じ話）。
- ログインはメールアドレスとパスワード。アカウントは env に並べる（`STUDIO_EMAIL` / `STUDIO_EMAIL_2` … 最大 5）。DB にユーザー表は作らない —— 数人で、招待も権限もパスワード再発行も要らないなら、表を持つと管理するものが増えるだけ。`matchAccount()` は**一致しても途中で止めず全員ぶん照合する**（早く返すと応答時間の差で「何番目のアカウントか」が漏れる）。硬さは四つで作っている（`docs/studio.md`）: scrypt ハッシュ・回数制限・ブラウザに縛った cookie・Telegram 通知。**回数制限を外さないこと** — これが無いと、パスワードをいくら長くしても総当たりは時間の問題になる。
- **`.env` の値に `$` を入れない**。dotenv は `scrypt$abc$def` の `$abc` / `$def` を未定義の変数として空に置き換えるので、値が `scrypt` の 6 文字になってログインが必ず失敗する（実際に踏んだ）。パスワードハッシュの区切りは `:`、生成する秘密は base64url（`+/=` も避ける）。
- セッション cookie は `SameSite=Lax`。`Strict` にすると外部サイトのリンクから `/studio` を開くたびにログインし直しになる（実際に踏んだ）。Server Action は POST なので、`Lax` でもクロスサイトからの書き込みには cookie が付かない。
- ログインの失敗理由（メールかパスワードか）を画面に出さない。メールが違ってもパスワードは必ず照合する — 早く返すと、応答の速さの差で「このアドレスは登録されている」が伝わる。
- `lib/studio-cookie.ts` を `lib/studio-session.ts` と分けてあるのは、proxy.ts（Edge）が cookie 名だけを必要とするため。session 側を import すると node:crypto が Edge に載って落ちる。
- `lib/studio-credentials.ts` は Next に依存しない。`node --experimental-strip-types` で直接読めるので、素の Node で照合を確かめられる。

## 落とし穴

- **client 部品に `Product` を丸ごと渡さない。** client に渡した props は RSC ペイロードとして HTML に焼き込まれる。以前は `MiniCart` に全九点を渡していて、どのページの HTML にも九点ぶんの物語（英日）が載っていた（2026-09-25 に削って、HTML は gzip で 7〜26% 減った）。渡すのは `CartPiece`（`data/products.ts` の `toCartPiece`）か slug だけ。client から `getProduct` / `productImage` を呼ばない（`products` 本体がバンドルに入る）— 画像は `leadSrc(folder)`。一覧（`PieceTile`）と商品ページのヒーローは Server Component なので `Product` をそのまま受けてよい。
- **state も effect も無い部品に `"use client"` を付けない**（`PieceTile` / `ProductHero` / `InquiryCta` は Server Component）。マークアップが大きくて動きだけが client の部品は、本体（server）+ `XxxMotion`（client、children を受けて `data-*` を探して動かす）に分ける — `HomeHero` / `EntryCurtain` がこの形。ただし `next/image` をサーバーで描くと srcset がペイロードに載るので、生のバイト数は増えることがある（gzip 後で判断する）。

- **`border-l` の引用バーを作らない**（markdown レンダラの既定＝AI感の元。引用は文字サイズと余白で立てる）。入力欄は罫線一本だけにしない（`bg-lacquer` + 全周ヘアライン）。`appearance-none` の `<select>` には矢印を自前で置く。エラー色は `clay`（`moss` は「購入可能」の色なので使わない）。
- **`globals.css` の独自クラスに `position` を書かない**。レイヤー外の CSS は Tailwind ユーティリティより強く、`fixed` 等を上書きする（モバイルメニューが崩れた原因）。
- `"use server"` ファイルから非 async 値（定数）を export すると 500。定数は `app/contact/subjects.ts` のような別モジュールへ。
- 浮遊アニメ（`.bag-float`）は WCAG 2.2.2 のため 3 周で止める設計。無限ループにしない。
- お問い合わせは `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` があれば Telegram 送信、無ければサーバーログのみ。
- microCMS の API キーに `NEXT_PUBLIC_` を付けない。`lib/microcms.ts` はサーバ専用 — `"use client"` から import しない。
- `NEXT_PUBLIC_SITE_URL` が OG 画像の `metadataBase`。本番ドメイン確定時に設定。

## デザイン

Always read `DESIGN.md` before making visual or UI decisions. Fonts, colours, spacing, image roles, and what not to build (feature-card rows, gold luxury, centered CTA stacks) live there.

**地は二つ**（2026-09-25）。**墨（`sumi` `#11100E`）の広間と、生成りの紙（`#E9E2D6`）**。純黒・純白はやめた（布の隣で画面の色に見えた）。どちらに置くかは**写真の光で決める** —— 蝋燭と金の光の堂内（トップのヒーロー・畳の部屋・祭壇・富士）は墨、窓の昼光で撮った作品と着姿、それに読むもの（一覧・商品ページ・Blog・FAQ・Legal・Contact）は紙。フッターは必ず墨。

- **トークンは役どころ**。`.surface-paper` の中では同じ名前が紙と墨に入れ替わる（`bg-sumi` は紙色、`text-ivory` は墨色）。部品は面を知らなくていい。面をまたいで変わらない色が要るときだけ `var(--sumi)` / `var(--paper)` / `var(--ivory)`。
- 地を塗る節は `surface-paper` / `surface-dark`、地を塗らずに字の色だけ合わせる `fixed` の部品は `tone-paper` / `tone-dark`。ヘッダー・章の柱は `useSurfaceAt()`（`hooks/`）で下を流れる面を読んで切り替える。カーソルの語は指しているものの面に合わせる。
- 面を持つ節は上下の余白を自分の内側に持つ（外の `mt` と足し算にしない）。
- 紙には粒（`--paper-grain`、σ≈1.5/255）が敷いてある。見て粒だと分かる強さにしない。
- `moss` / `indigo` / `clay` / `rose` は**状態表示にだけ**。紙の上では明度を落とした値に入れ替わる。
- **文字の段と余白はトークン**（`app/globals.css` の `@theme`）。見出しに clamp を手書きしない: `text-hero` / `text-display` / `text-section` / `text-title` / `text-piece` / `text-deck` / `text-body` / `text-small` / `text-meta`、大文字のラベルは `caps`（ナビ・CTA・完売の帯だけ）。**11px 未満を使わない**。余白は `beat` / `breath` / `pause`（節の間）と `lead`（見出し → 中身）。
- **書体**（2026-09-25 に jimotofoods.com.au に合わせて入れ替え）: 見出しは Poppins 300（`font-display`）、本文と UI は Nunito Sans（`font-sans`）、ワードマークの MIROKU だけ Prompt 300（`font-mark`）。三つとも OFL で `next/font/google` から自前配信（先方の Shopify の CDN から読まない）。Poppins と Prompt は可変フォントではないので `layout.tsx` で使う太さだけを読む（どちらも 300 の一枚）—— **`font-display` には必ず `font-light` を添える**。新しい太さを使うなら weight に足す（足さないと近い太さで代用されるか、合成の太字になる）。**先読みは第一画面に出る三枚だけ**（Poppins 300・Nunito Sans 立体・Prompt 300）。Blog の em に使う Nunito Sans の斜体は `preload: false` の別の呼び出し。**トップの Hero の一行（「Made once.」）だけは Newsreader Light の表示用の字形（opsz 72）**（2026-09-25。Poppins の四行見出しが SaaS / 制作会社の LP に見えていた。Instrument Serif は細長く詰まって安く見えたので同日に差し替え）。opsz 72・太さ 300 に固定した一枚を `components/home/fonts/` に置き、`next/font/local` で読む —— `next/font/google` だと本文用の字形（opsz 16）で届き、軸ごとだと 132KB。`components/home/HomeHero.tsx` で呼んでいるので先読みはトップだけ（`layout.tsx` に移すと全ページで先読みされる）。
- **日本語は Web フォントを読まない**（`--font-jp` は端末の明朝：ヒラギノ / 游明朝 / Noto Serif CJK）。2026-09-25 まで Shippori Mincho を読んでいたが、和文は約 120 のファイルに割られて配られ、その `@font-face` 245 個が 184KB の CSS として全ページの描画を止め、一覧では 36 本のフォントを取りに行っていた（「重い」の一番の原因だった。外して一覧の転送量 1,193KB → 569KB、最初の描画 3.5 → 1.1 秒）。戻すなら使う字だけに絞った一枚にすること。**Satoshi は使わない** —— ITF FFL が公開リポジトリでの配布を禁じていて、このリポジトリは公開。
- **見出しを行マスクで割るときは `splitLines()`（`components/motion/split-lines.ts`）を通す**。`SplitText.create(…, { mask: "lines" })` を直に呼ぶと、マスクが行の箱ちょうどになり、Poppins の g・p・y の足が切れたまま残る（実際に踏んだ）。起点は `LINES_FROM`。また SplitText は `display:none` の `<br>` でも改行するので、幅によって出し入れする改行は動きのある画面では効かない。
- **動き**は曲線一つ（`--ease-soft` = GSAP `power4.out`、`components/motion/tokens.ts`）。動くのは節の入口（見出しの行・写真のマスク）だけで、一覧・表・コレクションの格子は動かさない。

## 未着手 / 次フェーズ

- Stripe Checkout（現状は Add to cart → Send this cart → お問い合わせで取り置き → 手動決済案内）。
- 日本語版ページ（i18n）。
- 26 点の正式な名前・文言・価格・寸法（今は仮。価格は未定で Coming soon、`data/products.ts` の冒頭の註）。
- 着姿のうち、どの作品か特定できていないカット（`image/` の 0.10.03・0.13.02/14/28）の割り当て。
- `site.email` / `site.instagram` の実値差し替え。

## コマンド

```bash
npm run dev     # localhost:3000
npm run lint    # eslint
npm run build   # next build（デプロイ前必須）
npm test        # jest（__tests__/。変換は next/jest）
```
