-- Stripe の Webhook を、再送に強くする（2026-10-09）。
--
-- 以前は「注文の行を入れた」ことを「初めての配達」の印にしていた。注文の行を入れたあとで
-- 完売の書き込みや知らせが途中で落ちると、Stripe が再送しても「もう注文はある」= 再送と
-- みなされ、お店とお客さまへのメールも、二重販売の確認も、二度と走らなかった。
--
-- 売れたことの記録（注文の行・完売・二重販売の判定）は、関数 record_sale の一つのトランザクション
-- で決める。行を押さえて（for update）決めるので、同じ作品を同時に払った二つの決済も、同じ決済の
-- 再送も、管理画面の書き込みも、間に割り込めない。決めた結果は注文の行に残し、再送ではそれを返す
-- （作品の状態をあとから読み直して判定し直さない）。知らせ（メール）は記録のあとで、一通ずつ送る。
--
-- orders
--   sale_recorded_at  売れたことを記録した時刻（record_sale が入れる）
--   clashes           決済の前にもう買えなかった作品（二重販売の疑い）。[{slug, status}]
--   notified_at       知らせを出し終えた時刻。null なら、再送でもう一度やる
--   notifying_at      いま知らせを出している配達の印（借りた時刻）。同じ配達が同時に届いても一方だけが
--                     進む。落ちて残っても、一定時間たてば次の再送が借り直せる
--   mails_sent        送り終えたメール（store / customer / double_sale、送れないと分かったものは
--                     `:failed` を付けて残す）。途中で落ちた再送では、残りだけ送る
-- piece_overrides
--   sold_session      その作品を完売にした決済（Stripe の Checkout Session の ID）。二重販売だった
--                     作品には付けない。管理画面で手でステータスを変えたら空に戻す
--
-- Supabase の SQL Editor で流す。何度流しても同じ結果になる。**コードより先に流す**。

alter table orders add column if not exists sale_recorded_at timestamptz;
alter table orders add column if not exists clashes jsonb;
alter table orders add column if not exists notified_at timestamptz;
alter table orders add column if not exists notifying_at timestamptz;
alter table orders add column if not exists mails_sent text[] not null default '{}';
alter table piece_overrides add column if not exists sold_session text;

-- この SQL より前に（古いコードで）入った注文は、記録も知らせも済んだものとして扱う。
-- 新しいコードの注文は record_sale が sale_recorded_at を入れるので、あとでもう一度流しても触らない。
update orders
   set sale_recorded_at = created_at,
       notified_at = coalesce(notified_at, created_at)
 where sale_recorded_at is null;

create or replace function record_sale(
  p_session        text,
  p_intent         text,
  p_slugs          text[],  -- 完売にする作品（Stripe の明細と決済の metadata の和集合）
  p_order_slugs    text[],  -- 注文の行に残す slug
  p_amount_cents   integer,
  p_currency       text,
  p_customer_name  text,
  p_customer_email text,
  p_shipping       jsonb,
  p_code_status    jsonb    -- {slug: status}。行が無い・status が空の作品は、この状態（data/products.ts）とみなす
)
returns table (sale_order_id bigint, sale_notified_at timestamptz, sale_mails_sent text[], sale_clashes jsonb)
language plpgsql
set search_path = public
as $$
declare
  o orders%rowtype;
  s text;
  cur_status text;
  cur_session text;
  effective text;
  found jsonb := '[]'::jsonb;
begin
  insert into orders (stripe_session, stripe_intent, slugs, amount_cents, currency, status,
                      customer_name, customer_email, shipping)
  values (p_session, p_intent, coalesce(p_order_slugs, '{}'), p_amount_cents, coalesce(p_currency, 'aud'),
          'paid', p_customer_name, p_customer_email, p_shipping)
  on conflict (stripe_session) do nothing;

  -- 同じ決済の配達が同時に届いたら、ここで一つずつに並ぶ
  select * into o from orders where stripe_session = p_session for update;

  if o.sale_recorded_at is null then
    foreach s in array coalesce(p_slugs, '{}') loop
      insert into piece_overrides (slug) values (s) on conflict (slug) do nothing;
      -- 別の決済が同じ作品を同時に払っていたら、ここで一つずつに並ぶ
      select po.status, po.sold_session into cur_status, cur_session
        from piece_overrides po where po.slug = s for update;
      effective := coalesce(cur_status, p_code_status ->> s);
      if effective in ('sold_out', 'reserved') and cur_session is distinct from p_session then
        -- 決済の前にもう買えなかった。お金は入ったので完売にするが、この決済の印は付けない
        found := found || jsonb_build_array(jsonb_build_object('slug', s, 'status', effective));
        update piece_overrides set status = 'sold_out', updated_at = now() where slug = s;
      else
        update piece_overrides set status = 'sold_out', sold_session = p_session, updated_at = now()
         where slug = s;
      end if;
    end loop;
    update orders set clashes = found, sale_recorded_at = now() where id = o.id returning * into o;
  end if;

  return query select o.id, o.notified_at, o.mails_sent, coalesce(o.clashes, '[]'::jsonb);
end;
$$;

-- 呼べるのはサーバー（service_role）だけ。公開の鍵（anon）から注文を作らせない
revoke execute on function record_sale(text, text, text[], text[], integer, text, text, text, jsonb, jsonb) from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke execute on function record_sale(text, text, text[], text[], integer, text, text, text, jsonb, jsonb)
      from anon, authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function record_sale(text, text, text[], text[], integer, text, text, text, jsonb, jsonb)
      to service_role;
  end if;
end;
$$;
