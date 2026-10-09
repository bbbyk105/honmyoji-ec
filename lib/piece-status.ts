import "server-only";

import type { PostgrestClient } from "@supabase/postgrest-js";

/* ------------------------------------------------------------------
   管理画面からステータスを書く（作品の編集・一覧のまとめての変更）。**開いたときの状態の
   ままなら書く**（比較交換）。読んでから書くまでの間に Webhook が完売にしても上書きしない。

   手でステータスを変えたら、完売にした決済の印（sold_session）を空に戻す —— 残すと、その決済の
   Webhook の再送が、手で付けた取り置きや完売を「自分の完売」とみなし、二重販売を見逃す。
   ------------------------------------------------------------------ */

/**
 * 開いたときの状態（stored）のままなら patch を書く。書けたら true。
 *
 * @param stored 開いたときの行の status。行が無い = undefined、行はあるが status が空 = null
 */
export async function writeStatusIfUnchanged(
  client: PostgrestClient,
  slug: string,
  stored: string | null | undefined,
  patch: Record<string, unknown>,
): Promise<boolean> {
  const row = { ...patch, sold_session: null };
  const write =
    stored === undefined
      ? client.from("piece_overrides").upsert({ slug, ...row }, { onConflict: "slug", ignoreDuplicates: true })
      : stored === null
        ? client.from("piece_overrides").update(row).eq("slug", slug).is("status", null)
        : client.from("piece_overrides").update(row).eq("slug", slug).eq("status", stored);
  const { data, error } = await write.select("slug");
  if (error) throw error;
  return (data ?? []).length > 0;
}
