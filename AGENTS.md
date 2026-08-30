<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MIROKU（honmyoji-ec）— プロジェクト知識

## 概要

静岡県富士市・本妙寺で作られる「畳の縁バッグ」の EC サイト（Next.js 16 App Router + Tailwind v4）。
販売者名は **MIROKU**、英語メイン・日本語サブ（日本語版ページは後日フェーズ）。価格は USD 固定表示。
クライアント資料の原典は `内容.txt`（SKU 体系・FAQ・創業者略歴・特商法・ブランドコピー）。

## 構成

- `DESIGN.md` — 視覚言語の正本。UI を触る前に読む。
- `data/products.ts` — **商品カタログはコード内**。価格・ステータス（available / reserved / sold_out / coming_soon）・寸法・素材はここを編集する。DB は無い。
- `data/site.ts` — ブランドコピー・FAQ・創業者・特商法/返品ポリシー。
- `data/journal.ts` — Journal / Stories。記事を足すときはここ。
- `app/` — `/` `/collection` `/collection/[slug]` `/about` `/journal` `/journal/[slug]` `/faq` `/legal` `/contact`（Server Action）。
- `components/collection/GalleryStrip.tsx` — **スマホのギャラリー**（`md:hidden`）。snap の横スワイプ + `01 / 05` カウンタ。写真1枚の作品は自動で普通の一枚に落ちる。md 以上は従来の編集グリッド（`hidden md:grid`）。
- `components/collection/FloatingBag.tsx` — カットアウトの浮遊展示。**一覧もトップも全点これ**（4:5 の展示台・同じ接地線）。大小で序列を付けず、hover で `scale(1.06)` + 10px 浮上（`.bag-lift`、原点は接地線）。像の枠は `cutoutScale`（台の高さに対する割合）× `cutoutAspect`（cutout.webp の実比率）で決まる。`ProductHero.tsx` も同じ枠なので morph がずれない。`StillTile.tsx` — 4:5 静物タイル（トップの締めと関連商品のみ）。`PieceSlug.tsx` — `/sakura-cherry` のように URL slug を読む。
- `components/site/Frame.tsx` — 写真井戸。`data-image-role` / `data-image-ratio` 属性付き。差し替えは `src` だけ。role・比率のキャプション表示は `showRole`（既定 off）。
- `components/cart/` — Cart（localStorage）と MiniCart。決済は Contact へ手渡し。slug と旧 folder 名の両方を `getProduct` で解決する。**表示は Cart だが localStorage キーは `miroku-held` のまま**（変えると既存のカートが空になる）。UI 上の「Hold / Held」は 2026-08-31 に全て Cart 系の語へ置換済み。
- `components/site/` — Header（GSAP ハンバーガー, viewTransitionName=site-header）/ Footer / Reveal（ScrollTrigger）/ BeriBand / Newsletter。**Button は全ページ共通**（`solid` / `outline` / `outline-light` / `link` / `link-light`、href があれば Link・無ければ button）。CTA を新しく置くときは素の `<Link className="link-line">` ではなく Button を使う — `link-line` は hover で初めて罫が出るので、CTA には弱い。
- `components/motion/` — Lenis + GSAP 登録。`SmoothScroll` がルートを包む。メニュー／カート中は `stopLenis()`。
- `components/site/ImageWell.tsx` — 写真の「開き方」。`Frame` / `StillTile` の井戸はこれ。`wipe`（下端から開く・既定）と `band`（中央から左右へ・ヒーローのみ）。マスクは井戸ではなく内側の層に掛かるので、上に載せた見出しは開いている間も動かない。
- `components/site/DriftBand.tsx` — 縦スクロールに紐付けて横に流れる写真の帯。自走マーキーにはしない。**並べるのはバッグが主役の写真だけ**（風景・堂内のカットは入れない）。
- 商品 URL は読みやすい複合 slug（`sakura-cherry`）。画像フォルダは `folder`（`sakura`）。旧 URL は `next.config.ts` で恒久リダイレクト。

## 画像パイプライン（重要）

- 原本は `public/本妙寺*/`（iPhone JPEG、数百 MB、EXIF 回転あり）。**git 管理外**（.gitignore）で、サイトからは参照しない。
- `scripts/prepare-images.py` が原本 → `public/images/{products,scenes,texture}/*.webp` を生成する。
  - 商品カットアウト（背景除去）は rembg の **birefnet-general**（初回 ~1GB DL）＋「最大連結成分のみ残す」後処理。isnet/u2net は草地・壁で背景が残るので使わない。
  - 実行: `python3 -m venv .venv && .venv/bin/pip install rembg onnxruntime pillow scipy && .venv/bin/python scripts/prepare-images.py`
  - 新しい商品写真が来たら `PRODUCTS` に slug と元ファイルを追加 → 実行 → `data/products.ts` に `galleryCount` / `cutoutScale` を合わせる。
- 畳の縁マクロ（`texture/beri-*.webp`）は原本の座標指定で切り出している。写真が差し替わったら座標も見直す。
- **切り出しは掲載する比率と同じ比率で**。`beri-indigo` は 4:5（home /material・journal リード）、`beri-sakura` は 16:10（journal 本文）。横長の原稿を 4:5 の井戸に入れると object-cover で削られた分だけ実効解像度が落ち、拡大されて荒れる。掲載側にも `max-w` を付けて、原稿以上の大きさを要求しないこと。
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

## 落とし穴

- **`border-l` の引用バーを作らない**（markdown レンダラの既定＝AI感の元。引用は文字サイズと余白で立てる）。入力欄は罫線一本だけにしない（`bg-paper` + 全周ヘアライン）。`appearance-none` の `<select>` には矢印を自前で置く。エラー色は `clay`（`moss` は「購入可能」の色なので使わない）。
- **`globals.css` の独自クラスに `position` を書かない**。レイヤー外の CSS は Tailwind ユーティリティより強く、`fixed` 等を上書きする（モバイルメニューが崩れた原因）。
- `"use server"` ファイルから非 async 値（定数）を export すると 500。定数は `app/contact/subjects.ts` のような別モジュールへ。
- 浮遊アニメ（`.bag-float`）は WCAG 2.2.2 のため 3 周で止める設計。無限ループにしない。
- お問い合わせは `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` があれば Telegram 送信、無ければサーバーログのみ。
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
