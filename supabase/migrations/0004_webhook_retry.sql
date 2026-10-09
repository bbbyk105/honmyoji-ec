-- Stripe の Webhook を、再送に強くする（2026-10-09）。
--
-- 以前は「注文の行を入れた」ことを「初めての配達」の印にしていた。注文の行を入れたあとで
-- 完売の書き込みや知らせが途中で落ちると、Stripe が再送しても「もう注文はある」= 再送と
-- みなされ、お店とお客さまへのメールも、二重販売の確認も、二度と走らなかった。
--
-- 1. orders.notified_at — お店とお客さまへの知らせを出した時刻。null なら、再送のときに
--    もう一度出す。同じ配達が同時に二つ届いても、ここを先に取った方だけが送る。
-- 2. piece_overrides.sold_session — その作品を完売にした決済（Stripe の Checkout Session の ID）。
--    再送で「もう完売」を見たとき、自分の決済で完売にしたのか（前の配達が途中まで進んでいた）、
--    別の決済で売れていたのか（二重販売）を見分ける。
--
-- Supabase の SQL Editor で一度流す。何度流しても同じ結果になる。

alter table orders add column if not exists notified_at timestamptz;
alter table piece_overrides add column if not exists sold_session text;

-- いまある注文は、知らせ済みとして扱う（古い注文の再送で、メールを二度送らない）
update orders set notified_at = created_at where notified_at is null;
