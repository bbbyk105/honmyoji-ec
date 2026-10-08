# /studio — 管理画面と Stripe

一般の来訪者には見えない管理画面。`/studio` に置いてあり、サイトのどこからもリンクしていない。

---

## 何ができるか

| 画面 | できること |
|---|---|
| `/studio` | 未発送の注文と在庫の要約 |
| `/studio/pieces` | 全作品の一覧。**チェックを入れた作品のステータスをまとめて切り替えられる**（一点なら行の右の欄から） |
| `/studio/pieces/[slug]` | 価格・ステータス・一言・物語の編集 |
| `/studio/orders` | 注文の一覧 |
| `/studio/orders/[id]` | 送り先・発送状況・追跡番号・覚え書き |

写真の枚数・カットアウトの比率・寸法・SKU は `data/products.ts` のまま。写真の差し替えや実測とセットでしか変わらない値なので、管理画面からは触れない（二重管理になるだけで、管理画面から直しても写真は付いてこない）。

## 値の重ね方

商品カタログの正本は `data/products.ts`。DB (`piece_overrides`) にあるのは管理画面から動かしたい値だけで、**行が無ければコード側の値がそのまま出る**。

```
data/products.ts  ──┐
                    ├─→ lib/catalog.ts の getCatalog() ─→ 公開ページ / 管理画面
piece_overrides ────┘   （DB が落ちてもコード側の値で立つ）
```

編集画面の placeholder にはコード側の値が出る。空欄で保存すると、その項目はコード側に戻る。`上書きを取り消してコード側に戻す` は行ごと消す。

## 見えないようにしている仕組み

- **リンクしない** — ヘッダー・フッター・sitemap のどこにも `/studio` は出てこない
- **`X-Robots-Tag: noindex, nofollow, noarchive`** — `proxy.ts` が `/studio/*` の全応答に付ける
- **`robots` メタ** — `app/studio/layout.tsx` にも入れて二重にしてある
- **robots.txt には書かない** — 書けば「/studio があります」と公開することになる
- **`frame-ancestors 'none'` / `X-Frame-Options: DENY`** — 他所のページに iframe で埋め込ませない
- **`Referrer-Policy: no-referrer`** — 管理画面から外部リンクを踏んでも URL が漏れない

---

## ログイン

**メールアドレスとパスワード**で入る。アカウントは環境変数に並べる（最大 5 人）。
DB にユーザー表は作らない —— 数人で、招待も権限もパスワード再発行も要らないなら、
表を持つと管理するものが増えるだけになる。

```bash
STUDIO_EMAIL=          / STUDIO_PASSWORD_HASH=       # 1 人目
STUDIO_EMAIL_2=        / STUDIO_PASSWORD_HASH_2=     # 2 人目
STUDIO_EMAIL_3=        / STUDIO_PASSWORD_HASH_3=     # 3 人目 … 5 まで
```

`STUDIO_SESSION_SECRET` は全員で共有する一本の署名鍵。作り直すと全員のセッションが切れる。
誰が入ったかはお店へのメール（Resend）に出る。

画面はそれだけだが、裏では四つで守っている。

**1. パスワードは scrypt のハッシュで持つ**
`STUDIO_PASSWORD_HASH=scrypt:<salt>:<hash>`。Vercel のダッシュボードを見られる人にも、
ログに漏れたときにも、パスワードそのものは分からない。平文の `STUDIO_PASSWORD` でも動くが、
ログイン画面が移行を促す。

**2. 回数制限**
同じ IP から **15 分に 5 回**失敗すると、窓が抜けるまで受け付けない。これが無いと、
パスワードをいくら長くしても総当たりは時間の問題になる。記録は Supabase
（`studio_auth_attempts`）— サーバーレスでは実行ごとにメモリが別なので、プロセス内の
カウンタは本番で意味を成さない。照合の前に失敗を一つ先に書いてから数える（数えてから
書くと、同時に送った分が全部「まだ 0 回」を見て通る）。IP は Cloudflare では
`cf-connecting-ip`（`x-forwarded-for` の先頭は客が書ける）、Vercel では `x-forwarded-for`。

**3. セッションをブラウザに縛る**
cookie には有効期限とブラウザの印（User-Agent のハッシュ）を入れて署名している。
cookie を丸ごと抜かれても、別のブラウザに貼れば通らない。本番の cookie 名は `__Host-`
接頭辞付きで、`Secure` + `Path=/` + `SameSite=Lax`。他のサブドメインから偽のセッションを
書き込めない。有効期限は 8 時間。

`Strict` ではなく `Lax` なのは、`Strict` だと外部サイト（Stripe のダッシュボードやメール）の
リンクから開くたびにログインし直しになるため。Server Action は POST なので、`Lax` でも
クロスサイトからの書き込みには cookie が付かない。

**4. 締め出しと入室をその場で知らせる**
5 回失敗して締め出しが掛かるとメールが届く。ログイン成功も届く。身に覚えがなければ、
その場で `STUDIO_SESSION_SECRET` を変えれば全セッションが切れる。

**どちらが違ったかは画面に出さない。** 「このアドレスは登録されている」と分かると、
あとはパスワードだけを攻めればよくなる。メールが違ってもパスワードは必ず照合し、
**一致しても途中で止めず全員ぶん照合してから返す**（早く返すと、応答の速さの差で
「登録されている」「何番目のアカウントか」が漏れる）。理由はサーバーログにだけ残す。

### アカウントの作り方

```bash
npm run studio:secrets        # 1 人目
npm run studio:secrets 2      # 2 人目（3〜5 も同じ）
```

メールアドレスを聞き、パスワードを伏せて 2 回聞いたあと、その人ぶんの env 行を出す。
**平文のパスワードはどこにも保存されない**（人が憶えるだけ）。出た行を `.env` と
Vercel の Environment Variables に入れ、古い `STUDIO_PASSWORD` は消す。
`STUDIO_SESSION_SECRET` は 1 人目のときだけ出る（全員で共有するため）。

`STUDIO_SESSION_SECRET` を変えると、開いていたセッションは全部切れる。乗っ取りが
疑わしいときの非常口。

---

## 設置手順

### 1. Supabase

プロジェクト: `MIROKU` 組織の `miroku-web`（Tokyo / ap-northeast-1）。

SQL Editor で `supabase/migrations/` の中を番号順にそのまま流す。テーブルが三つできる。

- `piece_overrides` — 商品の上書き（0001）
- `orders` — 注文（0001）
- `studio_auth_attempts` — ログインの試行記録。回数制限の土台（0002）
- 0003 はテーブルを作らない。`piece_overrides.status` の check に受注生産（`made_to_order`）を足すだけ。流していないと、受注生産を選んだときに「データベースがこのステータスをまだ受け付けません」と出る

いずれも RLS を有効にしてポリシーは作っていない。読み書きするのはサーバー側の `service_role` だけで、これは RLS をバイパスする。anon キーが公開バンドルに紛れ込んでも、この三つには一行も届かない。

### 2. 環境変数

`.env.local`（ローカル）と Vercel の Environment Variables（本番）に入れる。

```bash
# Supabase — Settings → API
SUPABASE_URL=https://hopjtenwkxahsjaagpeb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=

# /studio のアカウント。`npm run studio:secrets [人数目]` が出す。
# メール＋ハッシュが 1 組以上と SESSION_SECRET が揃って初めてログイン画面が出る。
STUDIO_EMAIL=
STUDIO_PASSWORD_HASH=
STUDIO_EMAIL_2=
STUDIO_PASSWORD_HASH_2=
STUDIO_SESSION_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# お店への知らせ（Resend）。お問い合わせ・新作のお知らせの登録・注文・二重販売の警告・管理画面のログイン
RESEND_API_KEY=
RESEND_FROM=      # 例: MIROKU <notify@example.com>。Resend で認証したドメインのアドレス
NOTIFY_EMAILS=    # 受け取るアドレス。カンマ区切りで複数可
```

**メールの三つが無いと、お問い合わせも注文もお店に届かない**（お客さまの画面は「送れました」のまま、中身はサーバーのログに残るだけ）。公開から 2026-09-29 まで、この状態だった（当時は Telegram で、本番に `TELEGRAM_*` が入っていなかった）。ダッシュボードは鍵が無いと赤い帯で知らせる。`RESEND_FROM` を入れないと Resend の試験用アドレスから送られ、Resend のアカウントの持ち主にしか届かない。

`STUDIO_SESSION_SECRET` を変えると、開いていたセッションは全部切れる。

Vercel へは CLI でも入れられる。

```bash
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env pull .env.local --yes    # 逆向き（本番の値を手元へ）
```

### 3. Stripe

**キー** — ダッシュボード → 開発者 → API キー。シークレットキー（`sk_live_…` / テストは `sk_test_…`）を `STRIPE_SECRET_KEY` へ。

**Webhook** — 開発者 → Webhook → エンドポイントを追加。

- URL: `https://<本番ドメイン>/api/stripe/webhook`
- イベント: `checkout.session.completed` と `checkout.session.async_payment_succeeded` の二つ（後者は銀行振込のような後払い型の支払い方法の入金。カードだけなら来ないが、ダッシュボードで後払い型を有効にしたときに入金済みの注文が消えないように）
- API バージョン: Stripe の SDK と同じ（`node_modules/stripe` の `ApiVersion`。2026-10 時点で `2026-08-26.dahlia`）。古いと注文に届け先が入らない
- 出てくる `whsec_…` を `STRIPE_WEBHOOK_SECRET` へ

ローカルで試すときは Stripe CLI。

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# 表示された whsec_… を .env.local の STRIPE_WEBHOOK_SECRET に入れる
stripe trigger checkout.session.completed
```

**送料** — `lib/stripe-config.ts` の `SHIPPING_AUD`（A$40。2026-10-09 に確定）。0 にすると送料の行が出ず、送料込みになる。作品ごとには変えていない（一箱一点で、重さの差が送料の段に届かないため）。発送先の国も同じファイルの `SHIPPING_COUNTRIES`。

---

## 決済の流れ

```
カート → Check out
  → startCheckout()      在庫を**もう一度**見てから Checkout Session を作る
  → Stripe の決済画面     住所・電話・カード
  → /checkout/thank-you   カートを空にするだけ。注文はここでは作らない
  → Webhook              ここで注文が確定する
       ├ orders に 1 行（stripe_session が unique なので再送されても二重にならない）
       ├ 買われた作品を sold_out に（一点物なので自動で在庫から下ろす）
       └ 初めて入った注文ならお店にメール（再送では送らない）
```

**二重販売の備え**（一点物なので）。決済画面は開いてから 35 分で閉じる（Stripe の既定は 24 時間で、その間に別の人も同じ作品の決済画面を開けて、二人とも払えた）。それでも重なったとき —— 決済の前に作品がもう「完売」か「取り置き中」だったとき —— は、注文のメールとは別に「要確認」のメールが届く。どちらのお客さまに渡すかを決めて、もう一方は Stripe のダッシュボードから返金する。

**成功画面で注文を作らないのが要点**。カードは通ったのに客がタブを閉じた、という一番ありふれた経路で注文が消える。Webhook が保存に失敗したときは 500 を返して Stripe に再送させる。

商品は Stripe 側に登録していない。価格も文言も `data/products.ts` と管理画面が正本なので、二重に持つと必ずどちらかが古くなる。毎回 `price_data` でその場に組む。

Stripe の鍵が無いときは、カートは今まで通り「Send this cart」→ Contact → 手渡しの案内になる。鍵が無いだけでカートが 500 になることはない。

---

## 運用でよくあること

**一点売れた** — Stripe 経由なら Webhook が自動で `sold_out` にする。展示会や直接の手渡しで売れたときは `/studio/pieces` の一覧でステータスを切り替える（選んだ時点で保存される）。

**まとめて売り出す** — `/studio/pieces` で「販売予定」に絞り、「表示中をすべて選択」→「購入可能」→「に変更する」。確認のダイアログが出て、OK で公開中のサイトに出る。価格の無い作品は購入可能にしてもカートに入らない（帯に何点あるか出る）。

**価格を変えたい** — `/studio/pieces/[slug]` で保存すると、公開ページは `revalidatePath` でその場で作り直される。取りこぼしても 10 分で追いつく。

**発送した** — `/studio/orders/[id]` で状態を `Shipped` にして保存。保存した時刻が発送日になる。

**表示が変わらない** — dev server は `_next/image` の結果をキャッシュする。`npm run build && npx next start` で確かめる。
