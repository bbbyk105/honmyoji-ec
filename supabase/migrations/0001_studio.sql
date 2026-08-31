-- MIROKU studio — 管理画面が書き込む先。
--
-- 設計の要点: 商品カタログの「正本」は data/products.ts のまま。ここに置くのは
-- 管理画面から動かしたい値（価格・ステータス・一言・物語）だけで、行が無ければ
-- コード側の値がそのまま使われる。画像の枚数や cutout の比率のように、写真の
-- 差し替えとセットでしか変わらない値は DB に持たない — 二重管理になるだけで、
-- 管理画面から触っても写真が付いてこない。

-- ---------------------------------------------------------------------------
-- 商品のオーバーレイ。null の列は「コード側の値を使う」という意味。
-- ---------------------------------------------------------------------------
create table if not exists piece_overrides (
  slug       text primary key,
  price_aud  integer check (price_aud is null or price_aud > 0),
  status     text check (status is null or status in ('available', 'reserved', 'sold_out', 'coming_soon')),
  note       text,
  note_ja    text,
  story      text,
  story_ja   text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 注文。Stripe の Webhook が作り、管理画面が発送状況を進める。
--
-- 金額はセント単位の整数で持つ（Stripe と同じ単位）。小数で持つと為替でも税でも
-- ないところで 1 セントずれる。
-- ---------------------------------------------------------------------------
create table if not exists orders (
  id             bigint generated always as identity primary key,
  stripe_session text unique,
  stripe_intent  text,
  slugs          text[] not null default '{}',
  amount_cents   integer not null,
  currency       text not null default 'aud',
  status         text not null default 'paid'
                 check (status in ('paid', 'shipped', 'cancelled', 'refunded')),
  customer_name  text,
  customer_email text,
  shipping       jsonb,
  tracking       text,
  memo           text,
  created_at     timestamptz not null default now(),
  shipped_at     timestamptz
);

create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_status_idx on orders (status);

-- ---------------------------------------------------------------------------
-- RLS は有効にして、ポリシーは作らない。
--
-- 読み書きするのはサーバー側の service_role だけで、これは RLS をバイパスする。
-- anon キーが公開ページのバンドルに紛れ込んでも、この二つのテーブルには一行も
-- 届かない。ポリシーを足すのは、将来ブラウザから直接読む必要が出たときだけ。
-- ---------------------------------------------------------------------------
alter table piece_overrides enable row level security;
alter table orders enable row level security;
