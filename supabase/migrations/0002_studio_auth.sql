-- ログインの試行記録。回数制限の土台。
--
-- サーバーレスでは実行ごとにメモリが別なので、プロセス内のカウンタは本番で
-- 意味を成さない。数える場所が要る。

create table if not exists studio_auth_attempts (
  id     bigint generated always as identity primary key,
  ip     text not null,
  ok     boolean not null,
  reason text,
  at     timestamptz not null default now()
);

-- 「この IP の直近 15 分の失敗」を引くための索引
create index if not exists studio_auth_attempts_ip_at_idx
  on studio_auth_attempts (ip, at desc);

-- 他のテーブルと同じく、触れるのは service_role だけ
alter table studio_auth_attempts enable row level security;
