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
  - カテゴリ（`ProductLine`）は `tatami-beri`（ボトルバッグ）と `tote-bag`（トート）の二つ。**着物リメイクという区分は無い** — 九点とも畳の縁で、着物地は使っていない（2026-09-01 先方確認）。SKU の `MI-KIM-xxx` は先方の体系なのでそのまま残している。
  - ステータス（`ProductStatus`）は五つ。`made_to_order` は「写真の一点は出たが、同じ形を別の色で織り直せる」もの（翡翠・市松）。**ステータスを増やしたら七箇所を直す**: `data/products.ts` の型と `STATUS_LABEL` / `lib/catalog.ts` の `STATUSES` / `components/collection/StatusPill.tsx` / `components/collection/CollectionStudio.tsx` の絞り込み / `app/(site)/collection/[slug]/page.tsx` の `cta()` / `app/studio/options.ts` / `app/studio/page.tsx` の `PIECE_ORDER`。`Record<ProductStatus, …>` にしてある三箇所は `tsc` が教えてくれるが、`cta()` と絞り込みは黙って落ちる。
  - 買えるのは `available`（カート → Stripe）だけ。`made_to_order` は色を決める会話が要るのでカートに入れず、Contact（`subject=colour`）へ送る。
- `data/site.ts` — ブランドコピー・FAQ・創業者・特商法/返品ポリシー。
- `data/blog.ts` — Blog の**型とフォールバックの種**。記事本体は microCMS（下記）。ここは鍵の無い環境で Blog が空にならないようにするための seed で、記事を足す場所ではない。
- `lib/microcms.ts` — **Blog の記事はここから来る**。入稿の手順・スキーマ・Webhook は `docs/microcms.md`。
- `components/blog/BlogArticle.tsx` — 記事の組み。`/blog/[slug]`（公開）と `/blog/preview`（下書き）で共有する。**版面（980px）と行長（`--blog-measure` = 560px ≒ 70 文字）は別物** — 文章は measure で止め、写真だけが版面いっぱいに出る。両方 980px にすると 1 行 119 文字になる（2026-09-20 に直した）。`ch` で共有しないこと：Newsreader と Source Sans で `0` の幅が 15% 違うので、同じ `62ch` でも右端が揃わない。
- `components/blog/ArticleToc.tsx` — 記事の目次。版面の右の余白に絶対配置＋sticky、`xl` 以上・**見出し三つ以上**のときだけ。見出しは `[data-article-body]` の `h2` を**描かれた DOM から**拾う（本文は microCMS のリッチエディタ HTML と手書きブロックの二系統で、揃うのは描画後だけ）。id は CMS が振っていればそれを使い、無ければ見出しの文字から作る（`lib/heading-id.ts`）。現在地は `useScrollSpy`（トップの章のレールと共通）、送りは `scrollToChapter()`。
- `app/(site)/` — 公開サイト。`/` `/collection` `/collection/[slug]` `/about` `/blog` `/blog/[slug]` `/blog/preview` `/faq` `/legal` `/contact`（Server Action）`/checkout/thank-you`。**route group なので URL には `(site)` は出ない** — 外枠を `/studio` と分けるためだけの括り。
- `app/studio/` — **管理画面**（一般には見えない）。商品の価格・ステータス・文言と、Stripe の注文。手順と設計は `docs/studio.md`。
- `app/api/` — `revalidate`（microCMS Webhook）と `stripe/webhook`（決済の確定）。
- `app/layout.tsx` は html / body / フォントだけ。**ヘッダーやフッターをここに戻さない** — 親 layout は子から外せないので、`/studio` にサイトの外枠が付いてくる。公開サイトの外枠は `components/site/SiteChrome.tsx`（`app/(site)/layout.tsx` と `app/not-found.tsx` が共有する。404 は route group の layout を通らない）。
- `lib/catalog.ts` — **商品の読み口はここ一つ**。`data/products.ts` に DB のオーバーレイを重ねて返す。公開ページで `products` を直接 import しない（管理画面で直した値が反映されなくなる）。`getCatalog()` / `getPiece()` / `getPieces()`。`import "server-only"` 付き（`lib/microcms.ts` / `supabase.ts` / `stripe.ts` / `orders.ts` も同じ）— client から import するとビルドで止まる。
- `proxy.ts` — Next 16 で `middleware.ts` から改名。`/studio/*` の `noindex` ヘッダーと、cookie の無い訪問者をログインへ返す処理。**認可の本体はここではない**（Edge に node:crypto が無い）— 検証は `lib/studio-session.ts` の `requireSession()` で、ページと Server Action が毎回通る。
- `components/collection/Lightbox.tsx` — **写真を一枚で開くビューア**。`LightboxProvider` で囲み、`Zoomable index={n}` で `Frame` を包むと押せるようになる（`Frame` は Server Component からも使うので、onClick を生やさず透明な button を上に被せている）。当たり判定の本体は `ZoomHit` — Provider が無い場所では何も出さないので、Server Component の `ProductHero` もこれを置くだけ。**ビューア本体は `LightboxViewer.tsx` に分けて `next/dynamic` で遅延読み込み**（写真を開かない人の初回 JS に載せない。idle で先読みはする）。倍率と位置の計算は `lib/pan-zoom.ts`（純粋関数・テストあり）。**通し番号は 0 がヒーローの像、1 以降がギャラリー**。`GalleryStrip` には `offset={1}` を渡してずらす。地はサイトと同じ sumi — 一枚だけ別の明るさの部屋に持っていくと、そこだけ別のサイトになる。ホイール（カーソルの下を中心に）／ピンチ／＋− でズーム、拡大中は掴んで移動、等倍で横に払うと隣へ、下のバーの `← 01 / 06 →` とサムネイルで送れる、Esc で閉じる。**送りの矢印を写真の上に浮かせない** — stage が `setPointerCapture()` を取るので、押しても click が来ず反応しない（実際に踏んだ）。背後のスクロールはカートと同じ `useScrollLock`。
- **倍率と位置は一つの state に持つ**（`Lightbox.tsx` の `view`）。別々の `useState` にして倍率の updater の中から位置の setState を呼ぶと、React が updater を二度走らせる開発時に位置だけ二重に適用され、掴んだ点から倍ずれる（実際に踏んだ）。updater は純粋に保つこと。
- `components/collection/GalleryStrip.tsx` — **スマホのギャラリー**（`md:hidden`）。snap の横スワイプ + `01 / 05` カウンタ。写真1枚の作品は自動で普通の一枚に落ちる。md 以上は従来の編集グリッド（`hidden md:grid`）。
- `components/collection/FloatingBag.tsx` — カットアウトの浮遊展示。**一覧もトップも全点これ**（4:5 の展示台・同じ接地線）。大小で序列を付けず、hover で `scale(1.06)` + 10px 浮上（`.bag-lift`、原点は接地線）。**背丈は九点とも同じ**（`BAG_HEIGHT = 78`、2026-09-16 に `cutoutScale` を廃止）— 像の幅だけ `cutoutAspect` から決まる。横に太い musubi / ichimatsu は同じ背丈だと板をはみ出すので、そこだけ `SHELF_SPAN` で頭打ちにして低く立たせる。実寸の大小は像では言わず、下の SPEC の数字が言う。`ProductHero.tsx` も同じ背丈なので morph がずれない。**接地は棚板の罫**（`SHELF_INSET`）— 黒地で 12% の影は見えず、ぼかした光だまりは結局グラデーションになるので、接地線に ivory 25% のヘアラインを 1px 引く（hover で 45%）。台の内寸は九点とも 6% で揃える。詳細ページ（`ProductHero`）だけは列いっぱいに引く — 一番太い ichimatsu が列を埋めるので、内寸を取るとそこだけ板からはみ出す。**cutout.webp に透明の余白を残さないこと** — 枠は canvas の寸法（`cutoutAspect`）で決まるので、余白はそのまま「像が板から浮く」「左右にずれる」になる（2026-09-16 に九枚とも切り直した。Musubi が 67px 浮き、Ai が中心から 13% 左にいた）。`StillTile.tsx` — 4:5 静物タイル（トップの締めと関連商品のみ）。`SoldBand.tsx` — 完売の帯（像の縦中央に罫を一本引いて `Sold out`。位置は呼び出し側が渡す — 台の中央に固定すると背の低い作品で像の上に浮く）。**URL slug（`/sakura-cherry`）を画面に出さない** — 2026-09-01 に `PieceSlug` ごと外した。
- `components/site/Shell.tsx` — **版面の定数 `SHELL`**（`max-w-[1480px]` + 左右余白）。ヘッダー / フッター / ヒーロー / トップの全セクションがこれを使う。新しいセクションで `mx-auto max-w-... px-...` を手書きしない — 手書きに戻すと必ず 16px ずれる。
- `components/site/Frame.tsx` — 写真井戸。`data-image-role` / `data-image-ratio` 属性付き。差し替えは `src` だけ。role・比率のキャプション表示は `showRole`（既定 off）。
- `components/cart/` — Cart（localStorage）と MiniCart。決済は Contact へ手渡し。slug と旧 folder 名の両方を `findByKey` で解決する（計算は `lib/cart.ts`、テストあり）。カタログは `SiteChrome` がサーバーで引いて `CartProvider` に `CartPiece`（カートが読む項目だけ）で渡し、MiniCart は `useCart().pieces` を描く。`InquiryCta` は Server Component で、client に降りるのは `HoldButton`（slug だけ）。**表示は Cart だが localStorage キーは `miroku-held` のまま**（変えると既存のカートが空になる）。UI 上の「Hold / Held」は 2026-08-31 に全て Cart 系の語へ置換済み。
- `components/site/` — Header（GSAP ハンバーガー, viewTransitionName=site-header）/ Footer / Reveal（ScrollTrigger）/ BeriBand / Newsletter。**Button は全ページ共通**（`solid` / `outline` / `outline-light` / `link` / `link-light`、href があれば Link・無ければ button）。CTA を新しく置くときは素の `<Link className="link-line">` ではなく Button を使う — `link-line` は hover で初めて罫が出るので、CTA には弱い。
- `components/motion/` — Lenis + GSAP 登録。`SmoothScroll` がルートを包む（インスタンスを作るだけ）。止める・動かす・章へ送るは `components/motion/lenis.ts`（`stopLenis` / `startLenis` / `scrollToChapter`）— Lenis 本体を import しない小さな窓口。章の送りは Lenis があれば Lenis に頼む（ネイティブ smooth と慣性は引っ張り合う）。「動きを減らす」の判定は `prefersReducedMotion()`（`reduced-motion.ts`）— `matchMedia` を手書きしない。
- `hooks/` — 部品をまたいで繰り返す処理。`useScrollLock(active)`（背後を止める。**数えて止める** — 最後の一人が離れたときだけ外れるので、メニュー→カートの受け渡しでも外れない。命令的に使うなら `lockScroll()` が外す関数を返す）/ `useWindowEvent(type, handler, { enabled })`（handler は `useEffectEvent` で最新を読むので、state が変わっても付け直さない）/ `useScrollSpy(ids, start)`（いまどの節か。`null` の節は監視しない）。メニュー・カート・ビューアで `body.style.overflow` や Lenis を直に触らないこと。
- `components/motion/EntryCurtain.tsx` — **入場の幕**。同じセッションで一度だけ（`sessionStorage` の `miroku-entered`）。開き方は**二枚が左右へ退く**（上へ滑らせない — サイト中の所作が全部同じ向きになると安く見える。2026-09-20）。合わせ目にだけ ivory の罫を引く。**「もう見たか」は `SiteChrome` が body 先頭に置く一行の script が塗る前に決める** — mount 後の effect で判定すると、二度目以降に一瞬だけ幕が見える。その代償として `app/layout.tsx` の `<html>` に `suppressHydrationWarning` が要る（サーバの HTML に `data-entered` が無いので、無いと毎回 hydration mismatch が出る。実際に踏んだ）。
- `components/motion/PageTransition.tsx` — **ページの移り変わり**。見た目は `app/globals.css` の `::view-transition-*(.page)`（前のページが退き、新しいページが中央から左右へ開く）。この部品は「モーフかどうか」の印を `html` に置くだけ。**`main` は `SiteChrome` で `<ViewTransition default="page">` に包んである** — React は `<ViewTransition>` が関与する更新でしか遷移を開始しないので、包まないと CSS が一度も走らない（包む前は作品のモーフ以外で死んでいた）。`data-morph` が付いた導線（`Button` は `morph` prop）では地を静かに入れ替えるだけにする。**`html[data-morph]::view-transition-old(…)` に空白を入れないこと** — 疑似要素は html の子孫ではなく html 自身に付くので、子孫結合子だと一つも一致せず、モーフの下で版が開き続ける（実際に踏んだ）。
- `components/site/CursorMark.tsx` — **カーソルに灯る語**。`data-cursor="View"` / `"Zoom"` を持つものの上だけ（`FloatingBag` のリンクと `Lightbox` の `Zoomable`）。`lg` 以上かつ `pointer: fine` のときだけ。**`gsap.killTweensOf(el)` を使わないこと** — 追従を持っている `quickTo` のトゥイーンごと死に、語は出るのに印が画面の左上から動かなくなる（実際に踏んだ）。重なりの解決は `overwrite: "auto"` で。
- `components/site/ChapterRail.tsx` — **章の柱**。番号は `app/(site)/page.tsx` の `CHAPTERS` が持ち、`id` は各 `<section>` と一致させる（**節を足したら両方直す** — id の無い章は黙って飛ばされる）。ヒーローは sticky で ScrollTrigger が測れないので監視せず、「二つ目より上なら一つ目」で決める。**表紙にいるあいだは引く**（第一画面には縦組みと `01 — Honmyoji` が既にあり、重ねると 01 が二つ並ぶ）。
- `components/site/ImageWell.tsx` — 写真の「開き方」。`Frame` / `StillTile` の井戸はこれ。`wipe`（既定）と `band`（中央から左右へ・ヒーローのみ）。マスクは井戸ではなく内側の層に掛かるので、上に載せた見出しは開いている間も動かない。
  - **開く向きは `from`**（`bottom` / `left` / `right` / `top`）。**写真が版面のどの端に着いているかで決める** — 並んだ二枚が互いに向き合って開く。隣り合うときは `revealDelay` でずらす（同時に開くと一組の仕掛けに見える）。
  - **像の倍率は動かさない**（2026-09-20）。動くのはマスクの端と、4% 遅れて追いつく平行移動だけ。倍率 1.06 は平行移動で端が欠けないための余白なので、**クラスではなく effect で置く** — クラスで固定すると、写真の無い空の井戸の四辺の罫が枠の外へ出て消える。
  - **`Reveal` は井戸を含むブロックをフェードさせない**（キャプションだけ動かす）。写真と文章を一つの `Reveal` に同居させないこと — 同居すると文章が素で現れる。
- `components/site/DriftBand.tsx` — 縦スクロールに紐付けて横に流れる写真の帯。自走マーキーにはしない。**並べるのはバッグが主役の写真だけ**（風景・堂内のカットは入れない）。
- 価格の表記は `data/products.ts` の `aud` ひとつ（`A$220`）。ロケールを `en-AU` にすると記号が素の `$` に戻り、どの国のドルか分からなくなる。値段の隣に通貨名を書き足さない（記号が言っている）。
- 商品 URL は読みやすい複合 slug（`sakura-cherry`）。画像フォルダは `folder`（`sakura`）。旧 URL は `next.config.ts` で恒久リダイレクト。

## 画像パイプライン（重要）

- 原本は `public/本妙寺*/`（iPhone JPEG、数百 MB、EXIF 回転あり）。**git 管理外**（.gitignore）で、サイトからは参照しない。
- `scripts/prepare-images.py` が原本 → `public/images/{products,scenes,texture}/*.webp` を生成する。
  - 商品カットアウト（背景除去）は rembg の **birefnet-general**（初回 ~1GB DL）＋「最大連結成分のみ残す」後処理。isnet/u2net は草地・壁で背景が残るので使わない。
  - 実行: `python3 -m venv .venv && .venv/bin/pip install rembg onnxruntime pillow scipy && .venv/bin/python scripts/prepare-images.py`
  - 新しい商品写真が来たら `PRODUCTS` に slug と元ファイルを追加 → 実行 → `data/products.ts` に `galleryCount` / `cutoutAspect` を合わせる（`cutoutAspect` は script が出力する）。
  - **一点だけ作り直せる**: `.venv/bin/python scripts/prepare-images.py --only cutouts --product sakura`。他の八点の webp を書き換えないので、差分が一枚で済む。出力に `cutoutAspect` が出るので `data/products.ts` の値をそれに合わせること（一覧の展示台と詳細ヒーローが同じ枠を使っているので、片方だけずれると morph がずれる）。
  - カットアウトが**バッグの一部を食う**ことがある（桜は敷布の上に立っていて、左下の角が斜めに切り落とされていた）。原本と `cutout.webp` を並べるのではなく、`cutout.webp` をマゼンタ地に合成して見ると欠けが分かる。rembg のモデルを更新して同じ `--only cutouts` を回すと直ることがある（2026-09-01 の桜はこれで直った）。撮り直しの写真が来るまでは、無地の壁を背にした一枚を `main` に選ぶのが確実。
- **カットアウトは透明の余白を残さない**（`trim_box()`、alpha 2% で外接矩形を取る）。以前は影と浮遊アニメの逃げとして 4% 足していたが、影は CSS の drop-shadow、浮遊は transform で、どちらも要素の外へ描ける。余白を足すと接地の罫から像が浮く。
- 畳の縁マクロ（`texture/beri-*.webp`）は原本の座標指定で切り出している。写真が差し替わったら座標も見直す。
- **切り出しは掲載する比率と同じ比率で**。`beri-indigo` は 4:5（home /material・blog リード）、`beri-sakura` は 16:10（blog 本文）。横長の原稿を 4:5 の井戸に入れると object-cover で削られた分だけ実効解像度が落ち、拡大されて荒れる。掲載側にも `max-w` を付けて、原稿以上の大きさを要求しないこと。
- **画像を差し替えたら `.next/dev/cache/images` を消す**。`_next/image` の最適化結果は Next 16 ではここに残る（`.next/cache/images` ではない）。原本を差し替えても `X-Nextjs-Cache: STALE` のまま古いバイト列を返し続け、再検証もされない。しかも srcset の幅ごとに別エントリなので、`w=1080` は新しいのに `w=640` だけ古い、という混ざり方をする（2026-09-17 に踏んだ。九点の背丈を揃えたのに一覧がばらばらに見えたのがこれ）。**dev server を再起動するだけでは直らない** —— 起動時にディスクの内容を読むので、止める → 消す → 起動する、の順でないと同じ像が戻ってくる。
  ```bash
  pkill -f "next dev"; rm -rf .next/dev/cache/images .next/cache/images; npm run dev
  ```
  ブラウザ側にも残るので、直ったか見るときはハードリロード（⌘⇧R）する。確認は curl が早い —— 返ってきた webp の寸法が `data/products.ts` の `cutoutAspect` と合っていれば新しい。
  ```bash
  curl -s -H 'Accept: image/webp' 'http://localhost:3000/_next/image?url=%2Fimages%2Fproducts%2Fai%2Fcutout.webp&w=640&q=75' | file -
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
- 写真の枚数・`cutoutAspect`・寸法・SKU は DB に持たない。写真の差し替えとセットでしか変わらないので、管理画面から触れても写真が付いてこない。
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

- **client 部品に `Product` を丸ごと渡さない。** client に渡した props は RSC ペイロードとして HTML に焼き込まれる。以前は `MiniCart` に全九点を渡していて、どのページの HTML にも九点ぶんの物語（英日）が載っていた（2026-09-25 に削って、HTML は gzip で 7〜26% 減った）。渡すのは `CartPiece` / `ShelfPiece`（`data/products.ts` の `toCartPiece` / `toShelfPiece`）か slug だけ。client から `getProduct` / `productCutout` を呼ばない（`products` 本体がバンドルに入る）— 画像は `cutoutSrc(folder)`。
- **state も effect も無い部品に `"use client"` を付けない**（`FloatingBag` / `ProductHero` / `InquiryCta` は Server Component）。マークアップが大きくて動きだけが client の部品は、本体（server）+ `XxxMotion`（client、children を受けて `data-*` を探して動かす）に分ける — `HomeHero` / `EntryCurtain` がこの形。ただし `next/image` をサーバーで描くと srcset がペイロードに載るので、生のバイト数は増えることがある（gzip 後で判断する）。

- **`border-l` の引用バーを作らない**（markdown レンダラの既定＝AI感の元。引用は文字サイズと余白で立てる）。入力欄は罫線一本だけにしない（`bg-lacquer` + 全周ヘアライン）。`appearance-none` の `<select>` には矢印を自前で置く。エラー色は `clay`（`moss` は「購入可能」の色なので使わない）。
- **`globals.css` の独自クラスに `position` を書かない**。レイヤー外の CSS は Tailwind ユーティリティより強く、`fixed` 等を上書きする（モバイルメニューが崩れた原因）。
- `"use server"` ファイルから非 async 値（定数）を export すると 500。定数は `app/contact/subjects.ts` のような別モジュールへ。
- 浮遊アニメ（`.bag-float`）は WCAG 2.2.2 のため 3 周で止める設計。無限ループにしない。
- お問い合わせは `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` があれば Telegram 送信、無ければサーバーログのみ。
- microCMS の API キーに `NEXT_PUBLIC_` を付けない。`lib/microcms.ts` はサーバ専用 — `"use client"` から import しない。
- `NEXT_PUBLIC_SITE_URL` が OG 画像の `metadataBase`。本番ドメイン確定時に設定。

## デザイン

Always read `DESIGN.md` before making visual or UI decisions. Fonts, colours, spacing, image roles, and what not to build (feature-card rows, gold luxury, centered CTA stacks) live there.

**地は純黒の一色**（2026-09-20）。暖かい黒（`#14100b` 族）はやめた —— 黒に差した茶が最初に目に入り、UI が色を持っている状態で布と競っていた。トークンは色名ではなく役どころで、**面は `sumi`（`#000`）一つだけ**、文字は `ivory`（`#fff`・見出し・罫・塗り）→ `bone`（本文）→ `mist`（メタ・完売）、罫は `line`（`#303030`）と hover の `bark`。

**`onyx` / `lacquer` / `ash` はもう無い**（`ink` / `charcoal` / `paper` / `parchment` / `sand` も同様）。持ち上がる面も沈む面も作らないので、**面の境目は罫一本が全部背負う** —— 入力欄は全周の罫、フッターは横切る罫、トップで覆う面は上辺の罫。塗りで二つを分けたくなったら、それは二つ目の黒を戻している。`moss` / `indigo` / `clay` / `rose` は**状態表示にだけ**残してある。

## 未着手 / 次フェーズ

- Stripe Checkout（現状は Add to cart → Send this cart → お問い合わせで取り置き → 手動決済案内）。
- 日本語版ページ（i18n）。
- 商品写真の正式撮影後の差し替え（寸法・重量は暫定値、`data/products.ts` のコメント参照）。`Frame` の role / ratio は維持する。
- `site.email` / `site.instagram` の実値差し替え。

## コマンド

```bash
npm run dev     # localhost:3000
npm run lint    # eslint
npm run build   # next build（デプロイ前必須）
npm test        # jest（__tests__/。変換は next/jest）
```
