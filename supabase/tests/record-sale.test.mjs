// record_sale（supabase/migrations/0004_webhook_retry.sql）を、PGlite（WASM の Postgres）で動かして確かめる。
// 実行: npm test（jest のあとに node --test で流れる）。jest の中では PGlite が動かないので分けてある。

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const MIGRATIONS = join(import.meta.dirname, "..", "migrations");

let db;

async function migrate() {
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(join(MIGRATIONS, file), "utf8"));
  }
}

beforeEach(async () => {
  db = new PGlite();
  await migrate();
});

/** Webhook と同じ引数で呼ぶ。 */
async function recordSale({ session, slugs, codeStatus = {} }) {
  const { rows } = await db.query(
    "select * from record_sale($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
    [session, "pi_1", slugs, slugs, 18500, "aud", "Jane", "jane@example.com", null, JSON.stringify(codeStatus)],
  );
  return rows[0];
}

async function piece(slug) {
  const { rows } = await db.query("select status, sold_session from piece_overrides where slug = $1", [slug]);
  return rows[0];
}

test("初めての配達: 注文を作り、作品をこの決済の完売にする", async () => {
  await db.query("insert into piece_overrides (slug, status) values ('a', 'available')");
  const sale = await recordSale({ session: "cs_1", slugs: ["a"] });
  assert.deepEqual(sale.sale_clashes, []);
  assert.equal(sale.sale_notified_at, null);
  assert.deepEqual(await piece("a"), { status: "sold_out", sold_session: "cs_1" });
});

test("再送: 同じ結果を返し、作品にも注文にも触らない（二重販売とは言わない）", async () => {
  await db.query("insert into piece_overrides (slug, status) values ('a', 'available')");
  const first = await recordSale({ session: "cs_1", slugs: ["a"] });
  const retry = await recordSale({ session: "cs_1", slugs: ["a"] });
  assert.equal(retry.sale_order_id, first.sale_order_id);
  assert.deepEqual(retry.sale_clashes, []);
  const { rows } = await db.query("select count(*)::int as n from orders");
  assert.equal(rows[0].n, 1);
});

test("別の決済が先に払っていた: 二重販売として返し、先の決済の印は残す", async () => {
  await db.query("insert into piece_overrides (slug, status) values ('a', 'available')");
  await recordSale({ session: "cs_1", slugs: ["a"] });
  const second = await recordSale({ session: "cs_2", slugs: ["a"] });
  assert.deepEqual(second.sale_clashes, [{ slug: "a", status: "sold_out" }]);
  assert.deepEqual(await piece("a"), { status: "sold_out", sold_session: "cs_1" });
});

test("取り置き中だった: 二重販売（取り置き）として返して完売に。再送でも「取り置き」のまま", async () => {
  await db.query("insert into piece_overrides (slug, status) values ('a', 'reserved')");
  const first = await recordSale({ session: "cs_1", slugs: ["a"] });
  assert.deepEqual(first.sale_clashes, [{ slug: "a", status: "reserved" }]);
  assert.deepEqual(await piece("a"), { status: "sold_out", sold_session: null });
  const retry = await recordSale({ session: "cs_1", slugs: ["a"] });
  assert.deepEqual(retry.sale_clashes, [{ slug: "a", status: "reserved" }]);
});

test("行が無い作品はコード側の状態で決める（Coming soon なら売れる、コード側で完売なら二重販売）", async () => {
  const fine = await recordSale({ session: "cs_1", slugs: ["b"], codeStatus: { b: "coming_soon" } });
  assert.deepEqual(fine.sale_clashes, []);
  assert.deepEqual(await piece("b"), { status: "sold_out", sold_session: "cs_1" });

  const clash = await recordSale({ session: "cs_2", slugs: ["c"], codeStatus: { c: "sold_out" } });
  assert.deepEqual(clash.sale_clashes, [{ slug: "c", status: "sold_out" }]);
});

test("記録のあとで管理画面が販売中に戻したら、古い再送はもう完売にしない", async () => {
  await db.query("insert into piece_overrides (slug, status) values ('a', 'available')");
  await recordSale({ session: "cs_1", slugs: ["a"] });
  // 返金して、販売中に戻した（管理画面は sold_session を空にする）
  await db.query("update piece_overrides set status = 'available', sold_session = null where slug = 'a'");
  await recordSale({ session: "cs_1", slugs: ["a"] });
  assert.deepEqual(await piece("a"), { status: "available", sold_session: null });
});

test("この SQL より前の注文は記録・知らせ済みに。あとでもう一度流しても、新しい注文には触らない", async () => {
  await db.exec("drop table orders cascade; drop table piece_overrides cascade;");
  await db.exec(readFileSync(join(MIGRATIONS, "0001_studio.sql"), "utf8"));
  await db.query("insert into orders (stripe_session, amount_cents) values ('cs_old', 100)");
  await migrate();
  const old = (await db.query("select sale_recorded_at, notified_at from orders where stripe_session = 'cs_old'")).rows[0];
  assert.ok(old.sale_recorded_at && old.notified_at);

  // 新しいコードの注文（知らせの途中）
  await db.query("insert into piece_overrides (slug, status) values ('a', 'available')");
  await recordSale({ session: "cs_new", slugs: ["a"] });
  await migrate();
  const fresh = (await db.query("select notified_at from orders where stripe_session = 'cs_new'")).rows[0];
  assert.equal(fresh.notified_at, null);
});
