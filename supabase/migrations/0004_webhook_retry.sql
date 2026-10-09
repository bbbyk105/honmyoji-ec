-- Stripe の Webhook を、再送に強くする（2026-10-09）。
--
-- 以前は「注文の行を入れた」ことを「初めての配達」の印にしていた。注文の行を入れたあとで
-- 完売の書き込みや知らせが途中で落ちると、Stripe が再送しても「もう注文はある」= 再送と
-- みなされ、お店とお客さまへのメールも、二重販売の確認も、二度と走らなかった。
--
-- orders
--   notified_at   知らせ（お店・お客さま）を出し終えた時刻。null なら、再送でもう一度やる。
--   notifying_at  いま知らせを出している配達がある印（借りている時刻）。同じ配達が同時に届いても
--                 一方だけが進む。途中で落ちて残っても、一定時間たてば次の再送が借り直せる。
--   mails_sent    送り終えたメールの種類（store / customer / double_sale）。途中で落ちた再送では、
--                 送っていないものだけ送る（二通目を出さない）。
-- piece_overrides
--   sold_session  その作品を完売にした決済（Stripe の Checkout Session の ID）。再送で「もう完売」を
--                 見たとき、自分の決済で完売にしたのか、別の決済で売れていたのか（二重販売）を見分ける。
--                 管理画面で手でステータスを変えたら空に戻す。
--
-- Supabase の SQL Editor で一度流す。何度流しても同じ結果になる。**コードより先に流す**。

alter table orders add column if not exists notified_at timestamptz;
alter table orders add column if not exists notifying_at timestamptz;
alter table orders add column if not exists mails_sent text[] not null default '{}';
alter table piece_overrides add column if not exists sold_session text;

-- いまある注文は、知らせ済みとして扱う（古い注文の再送で、メールを二度送らない）。
-- 流したらすぐに新しいコードをデプロイすること（その間に古いコードが入れた注文は、ここで埋まらない）。
update orders set notified_at = created_at where notified_at is null;
