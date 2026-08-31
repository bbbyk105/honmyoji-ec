# microCMS — Journal の入稿

Journal（`/journal`）の記事は microCMS から読む。商品カタログ（`data/products.ts`）は
コード内のままで、CMS には入れていない。

## 1. 環境変数

`.env.example` をコピーして `.env.local` を作る。

| 変数 | 必須 | 内容 |
|---|---|---|
| `MICROCMS_SERVICE_DOMAIN` | ○ | `https://<これ>.microcms.io` の部分 |
| `MICROCMS_API_KEY` | ○ | 管理画面 → サービス設定 → API キー（GET があれば足りる） |
| `MICROCMS_JOURNAL_ENDPOINT` | – | API 名。既定 `journals` |
| `MICROCMS_WEBHOOK_SECRET` | – | Webhook の署名検証。未設定だと `/api/revalidate` は 503 |

**二つの必須変数が無い環境では、`data/journal.ts` の seed 記事が表示される。**
鍵の無いローカルやプレビューでもビルドと表示が通るようにするため。API が落ちた
ときも同じ経路で seed に落ち、理由は server log（`[microcms]`）に出る。

## 2. API スキーマ

**リスト形式**の API を一つ作る。API ID は `journals`。
コンテンツ ID がそのまま URL になる（`/journal/<コンテンツID>`）ので、
入稿時に `the-edge-that-remains` のような読める英字 ID を自分で入れること。
`preview` だけは予約語（下書きプレビュー用のパス）なので使わない。

| フィールド ID | 種類 | 必須 | 内容 |
|---|---|---|---|
| `title` | テキスト | ○ | 英語タイトル |
| `titleJa` | テキスト | | 日本語の副題（`残る縁`）。空なら出ない |
| `dek` | テキストエリア | | リード文。一覧と記事冒頭に出る一文 |
| `date` | 日時 | | 掲載日。空なら公開日時を使う |
| `season` | テキスト | | `Spring` / `Rainy season` など |
| `topic` | セレクト | | `Materials` / `Care` / `Place` / `Making`（単一選択） |
| `image` | 画像 | | 記事のリード写真。無いと role/ratio のプレースホルダが出る |
| `imageAlt` | テキスト | | 代替テキスト。空ならタイトルを使う |
| `imageRole` | セレクト | | `journal` / `material-macro` / `lifestyle` / `process`（既定 `journal`） |
| `imageRatio` | セレクト | | `4/5` / `16/10` / `3/4` / `1/1`（既定 `16/10`） |
| `pull` | テキストエリア | | 引用（本文の前に大きく組む一文） |
| `content` | リッチエディタ | ○ | 本文 |

写真は 4:5 や 16:10 の**掲載する比率で切ってから**上げる。横長の原稿を縦の井戸に
入れると、object-cover で削られたぶん実効解像度が落ちて荒れる（AGENTS.md 参照）。

本文の組みは `app/globals.css` の `.journal-prose`。見出し・引用・箇条書き・画像・
表まで版面に合わせてあるので、リッチエディタ側で色や文字サイズを指定しないこと。

## 3. 下書きプレビュー

管理画面 → API 設定 → 画面プレビュー に入れる URL：

```
https://<本番ドメイン>/journal/preview?slug={CONTENT_ID}&draftKey={DRAFT_KEY}
```

下書きはキャッシュせず毎回取り直す。画面下に「Draft preview」の帯が出る。

## 4. Webhook（公開したらすぐ反映）

記事は 10 分の定期再検証でも更新されるが、待たずに反映したいので Webhook を張る。

管理画面 → API 設定 → Webhook → **カスタム通知**

- URL: `https://<本番ドメイン>/api/revalidate`
- シークレット: `MICROCMS_WEBHOOK_SECRET` と同じ文字列

`X-MICROCMS-Signature`（ボディの HMAC-SHA256）を検証してから
`revalidateTag("journal")` を呼ぶ。署名が合わなければ 401 で何もしない。

動作確認:

```bash
BODY='{"service":"miroku","api":"journals"}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$MICROCMS_WEBHOOK_SECRET" -hex | awk '{print $2}')
curl -sS -X POST http://localhost:3000/api/revalidate \
  -H "content-type: application/json" -H "x-microcms-signature: $SIG" -d "$BODY"
# => {"revalidated":true,"tag":"journal",...}
```

## 5. 覚えておくこと

- 一覧は 1 回の取得で最大 100 件。それを超えたら `lib/microcms.ts` の `LIST_LIMIT`
  をページングに変える。詳細ページもこの一覧から引いている（記事ごとに叩かない）。
- 並び順は掲載日の**新しい順**。トップの「Recent notes」も一覧のリードもここから。
- トップの Material セクションの導線は slug を焼き込まず、素材の記事 → 最新記事 →
  一覧、の順に落ちる。CMS 側で記事を消してもリンク切れにならない。
- `data/journal.ts` は型とフォールバックの種だけ。記事を足すのは microCMS の管理画面。
