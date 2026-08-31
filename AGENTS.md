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
- `data/site.ts` — ブランドコピー・FAQ・創業者・特商法/返品ポリシー。
- `data/blog.ts` — Blog の**型とフォールバックの種**。記事本体は microCMS（下記）。ここは鍵の無い環境で Blog が空にならないようにするための seed で、記事を足す場所ではない。
- `lib/microcms.ts` — **Blog の記事はここから来る**。入稿の手順・スキーマ・Webhook は `docs/microcms.md`。
- `components/blog/BlogArticle.tsx` — 記事の組み。`/blog/[slug]`（公開）と `/blog/preview`（下書き）で共有する。
- `app/(site)/` — 公開サイト。`/` `/collection` `/collection/[slug]` `/about` `/blog` `/blog/[slug]` `/blog/preview` `/faq` `/legal` `/contact`（Server Action）`/checkout/thank-you`。**route group なので URL には `(site)` は出ない** — 外枠を `/studio` と分けるためだけの括り。
- `app/studio/` — **管理画面**（一般には見えない）。商品の価格・ステータス・文言と、Stripe の注文。手順と設計は `docs/studio.md`。
- `app/api/` — `revalidate`（microCMS Webhook）と `stripe/webhook`（決済の確定）。
- `app/layout.tsx` は html / body / フォントだけ。**ヘッダーやフッターをここに戻さない** — 親 layout は子から外せないので、`/studio` にサイトの外枠が付いてくる。公開サイトの外枠は `components/site/SiteChrome.tsx`（`app/(site)/layout.tsx` と `app/not-found.tsx` が共有する。404 は route group の layout を通らない）。
- `lib/catalog.ts` — **商品の読み口はここ一つ**。`data/products.ts` に DB のオーバーレイを重ねて返す。公開ページで `products` を直接 import しない（管理画面で直した値が反映されなくなる）。`getCatalog()` / `getPiece()` / `getPieces()`。
- `proxy.ts` — Next 16 で `middleware.ts` から改名。`/studio/*` の `noindex` ヘッダーと、cookie の無い訪問者をログインへ返す処理。**認可の本体はここではない**（Edge に node:crypto が無い）— 検証は `lib/studio-session.ts` の `requireSession()` で、ページと Server Action が毎回通る。
- `components/collection/Lightbox.tsx` — **写真を一枚で開くビューア**。`LightboxProvider` で囲み、`Zoomable index={n}` で `Frame` を包むと押せるようになる（`Frame` は Server Component からも使うので、onClick を生やさず透明な button を上に被せている）。ヒーローは `useLightboxSafe()` を使う — Provider が無い場所に置かれても壊れないため。**通し番号は 0 がヒーローの像、1 以降がギャラリー**。`GalleryStrip` には `offset={1}` を渡してずらす。地は ivory のまま — 一枚だけ暗室に持っていくと、そこだけ別のサイトになる。ホイール（カーソルの下を中心に）／ピンチ／＋− でズーム、拡大中は掴んで移動、等倍で横に払うと隣へ、下のサムネイルで直接飛べる、Esc で閉じる。`stopLenis()` はカートと同じ扱い。
- **倍率と位置は一つの state に持つ**（`Lightbox.tsx` の `view`）。別々の `useState` にして倍率の updater の中から位置の setState を呼ぶと、React が updater を二度走らせる開発時に位置だけ二重に適用され、掴んだ点から倍ずれる（実際に踏んだ）。updater は純粋に保つこと。
- `components/collection/GalleryStrip.tsx` — **スマホのギャラリー**（`md:hidden`）。snap の横スワイプ + `01 / 05` カウンタ。写真1枚の作品は自動で普通の一枚に落ちる。md 以上は従来の編集グリッド（`hidden md:grid`）。
- `components/collection/FloatingBag.tsx` — カットアウトの浮遊展示。**一覧もトップも全点これ**（4:5 の展示台・同じ接地線）。大小で序列を付けず、hover で `scale(1.06)` + 10px 浮上（`.bag-lift`、原点は接地線）。像の枠は `cutoutScale`（台の高さに対する割合）× `cutoutAspect`（cutout.webp の実比率）で決まる。`ProductHero.tsx` も同じ枠なので morph がずれない。`StillTile.tsx` — 4:5 静物タイル（トップの締めと関連商品のみ）。`PieceSlug.tsx` — `/sakura-cherry` のように URL slug を読む。
- `components/site/Shell.tsx` — **版面の定数 `SHELL`**（`max-w-[1480px]` + 左右余白）。ヘッダー / フッター / ヒーロー / トップの全セクションがこれを使う。新しいセクションで `mx-auto max-w-... px-...` を手書きしない — 手書きに戻すと必ず 16px ずれる。
- `components/site/Frame.tsx` — 写真井戸。`data-image-role` / `data-image-ratio` 属性付き。差し替えは `src` だけ。role・比率のキャプション表示は `showRole`（既定 off）。
- `components/cart/` — Cart（localStorage）と MiniCart。決済は Contact へ手渡し。slug と旧 folder 名の両方を `getProduct` で解決する。**表示は Cart だが localStorage キーは `miroku-held` のまま**（変えると既存のカートが空になる）。UI 上の「Hold / Held」は 2026-08-31 に全て Cart 系の語へ置換済み。
- `components/site/` — Header（GSAP ハンバーガー, viewTransitionName=site-header）/ Footer / Reveal（ScrollTrigger）/ BeriBand / Newsletter。**Button は全ページ共通**（`solid` / `outline` / `outline-light` / `link` / `link-light`、href があれば Link・無ければ button）。CTA を新しく置くときは素の `<Link className="link-line">` ではなく Button を使う — `link-line` は hover で初めて罫が出るので、CTA には弱い。
- `components/motion/` — Lenis + GSAP 登録。`SmoothScroll` がルートを包む。メニュー／カート中は `stopLenis()`。
- `components/site/ImageWell.tsx` — 写真の「開き方」。`Frame` / `StillTile` の井戸はこれ。`wipe`（下端から開く・既定）と `band`（中央から左右へ・ヒーローのみ）。マスクは井戸ではなく内側の層に掛かるので、上に載せた見出しは開いている間も動かない。
- `components/site/DriftBand.tsx` — 縦スクロールに紐付けて横に流れる写真の帯。自走マーキーにはしない。**並べるのはバッグが主役の写真だけ**（風景・堂内のカットは入れない）。
- 価格の表記は `data/products.ts` の `aud` ひとつ（`A$220`）。ロケールを `en-AU` にすると記号が素の `$` に戻り、どの国のドルか分からなくなる。値段の隣に通貨名を書き足さない（記号が言っている）。
- 商品 URL は読みやすい複合 slug（`sakura-cherry`）。画像フォルダは `folder`（`sakura`）。旧 URL は `next.config.ts` で恒久リダイレクト。

## 画像パイプライン（重要）

- 原本は `public/本妙寺*/`（iPhone JPEG、数百 MB、EXIF 回転あり）。**git 管理外**（.gitignore）で、サイトからは参照しない。
- `scripts/prepare-images.py` が原本 → `public/images/{products,scenes,texture}/*.webp` を生成する。
  - 商品カットアウト（背景除去）は rembg の **birefnet-general**（初回 ~1GB DL）＋「最大連結成分のみ残す」後処理。isnet/u2net は草地・壁で背景が残るので使わない。
  - 実行: `python3 -m venv .venv && .venv/bin/pip install rembg onnxruntime pillow scipy && .venv/bin/python scripts/prepare-images.py`
  - 新しい商品写真が来たら `PRODUCTS` に slug と元ファイルを追加 → 実行 → `data/products.ts` に `galleryCount` / `cutoutScale` を合わせる。
- 畳の縁マクロ（`texture/beri-*.webp`）は原本の座標指定で切り出している。写真が差し替わったら座標も見直す。
- **切り出しは掲載する比率と同じ比率で**。`beri-indigo` は 4:5（home /material・blog リード）、`beri-sakura` は 16:10（blog 本文）。横長の原稿を 4:5 の井戸に入れると object-cover で削られた分だけ実効解像度が落ち、拡大されて荒れる。掲載側にも `max-w` を付けて、原稿以上の大きさを要求しないこと。
- 画像を差し替えても dev server は `_next/image` の結果をキャッシュしたままになる。見た目が変わらないときは dev server を再起動するか `npm run build && npx next start` で確認する。

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
- `SiteHeader` の GSAP effect の deps は `open` **だけ**。`closeMode` を足すと、カートを開くとき（`open` は false のまま）に閉じる側が再実行され、`MiniCart` が掛けた `stopLenis` / `body.overflow` を打ち消す。

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
- 写真の枚数・`cutoutScale`・`cutoutAspect`・寸法・SKU は DB に持たない。写真の差し替えとセットでしか変わらないので、管理画面から触れても写真が付いてこない。
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

- **`border-l` の引用バーを作らない**（markdown レンダラの既定＝AI感の元。引用は文字サイズと余白で立てる）。入力欄は罫線一本だけにしない（`bg-paper` + 全周ヘアライン）。`appearance-none` の `<select>` には矢印を自前で置く。エラー色は `clay`（`moss` は「購入可能」の色なので使わない）。
- **`globals.css` の独自クラスに `position` を書かない**。レイヤー外の CSS は Tailwind ユーティリティより強く、`fixed` 等を上書きする（モバイルメニューが崩れた原因）。
- `"use server"` ファイルから非 async 値（定数）を export すると 500。定数は `app/contact/subjects.ts` のような別モジュールへ。
- 浮遊アニメ（`.bag-float`）は WCAG 2.2.2 のため 3 周で止める設計。無限ループにしない。
- お問い合わせは `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` があれば Telegram 送信、無ければサーバーログのみ。
- microCMS の API キーに `NEXT_PUBLIC_` を付けない。`lib/microcms.ts` はサーバ専用 — `"use client"` から import しない。
- `NEXT_PUBLIC_SITE_URL` が OG 画像の `metadataBase`。本番ドメイン確定時に設定。

## デザイン

Always read `DESIGN.md` before making visual or UI decisions. Fonts, colours, spacing, image roles, and what not to build (feature-card rows, gold luxury, centered CTA stacks) live there.

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
```
