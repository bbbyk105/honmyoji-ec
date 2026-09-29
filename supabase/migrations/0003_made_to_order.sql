-- 受注生産（made_to_order）を piece_overrides.status に通す（2026-09-29）。
--
-- 0001 を書いたあとで status に made_to_order が増えたが、ここの check を直していなかった。
-- 管理画面で「受注生産」を選ぶと保存が 23514（check 違反）で落ちていた。
-- Supabase の SQL Editor で一度流す。何度流しても同じ結果になる。

alter table piece_overrides drop constraint if exists piece_overrides_status_check;

alter table piece_overrides add constraint piece_overrides_status_check
  check (status is null or status in ('available', 'made_to_order', 'reserved', 'sold_out', 'coming_soon'));
