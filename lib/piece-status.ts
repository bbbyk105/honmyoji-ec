import "server-only";

import type { PostgrestClient } from "@supabase/postgrest-js";

/* ------------------------------------------------------------------
   管理画面からステータスを書く（作品の編集・一覧のまとめての変更）。**開いたときの状態の
   ままなら書く**（比較交換）。読んでから書くまでの間に Webhook が完売にしても上書きしない。

   手でステータスを変えたら、完売にした決済の印（sold_session）を空に戻す —— 残すと、その決済の
   Webhook の再送が、手で付けた取り置きや完売を「自分の完売」とみなし、二重販売を見逃す。
   ------------------------------------------------------------------ */

/** 開いたときの行の status。行が無い = undefined、行はあるが status が空 = null */
export type StoredStatus = string | null | undefined;

/**
 * 開いたときの状態のままの作品にだけ patch を書く。書けた slug を返す。
 *
 * 書き込みは開いたときの状態ごとに一本（作品の数ではなく、状態の種類の数だけ往復する）。
 * 途中で落ちたら、それまでに書けた slug と一緒に error を返す（書けた分を画面に言うため）。
 */
export async function writeStatusesIfUnchanged(
  client: PostgrestClient,
  stored: Map<string, StoredStatus>,
  patch: Record<string, unknown>,
): Promise<{ written: string[]; error?: { code?: string; message: string } }> {
  const row = { ...patch, sold_session: null };
  const groups = new Map<string, { stored: StoredStatus; slugs: string[] }>();
  for (const [slug, value] of stored) {
    const key = value === undefined ? "new" : value === null ? "null" : `eq:${value}`;
    const group = groups.get(key) ?? { stored: value, slugs: [] };
    group.slugs.push(slug);
    groups.set(key, group);
  }

  const written: string[] = [];
  for (const { stored: value, slugs } of groups.values()) {
    const table = client.from("piece_overrides");
    const write =
      value === undefined
        ? table.upsert(
            slugs.map((slug) => ({ slug, ...row })),
            { onConflict: "slug", ignoreDuplicates: true },
          )
        : value === null
          ? table.update(row).in("slug", slugs).is("status", null)
          : table.update(row).in("slug", slugs).eq("status", value);
    const { data, error } = await write.select("slug");
    if (error) return { written, error };
    written.push(...(data ?? []).map((r) => r.slug as string));
  }
  return { written };
}

/** 一点だけ書く（作品の編集）。書けたら true。 */
export async function writeStatusIfUnchanged(
  client: PostgrestClient,
  slug: string,
  stored: StoredStatus,
  patch: Record<string, unknown>,
): Promise<boolean> {
  const { written, error } = await writeStatusesIfUnchanged(client, new Map([[slug, stored]]), patch);
  if (error) throw error;
  return written.length > 0;
}
