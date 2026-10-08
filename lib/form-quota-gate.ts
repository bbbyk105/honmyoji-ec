import "server-only";

import type { FormQuotaResult } from "@/lib/form-quota";

/* ------------------------------------------------------------------
   公開フォームの Server Action から、一日の上限（lib/form-quota.ts）を一通ぶん取る。

   数えるのは Worker の Durable Object（FORM_QUOTA）。手元の `next dev` やテストには
   それが無いので通す。数えに行けないときも通す —— ここで閉じると、Cloudflare の不調が
   そのままお問い合わせの止まりになる。
   ------------------------------------------------------------------ */

type QuotaStub = { take(ip: string): Promise<FormQuotaResult> };
type QuotaNamespace = { idFromName(name: string): unknown; get(id: unknown): QuotaStub };

export async function takeFormQuota(ip: string): Promise<FormQuotaResult> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ns = (getCloudflareContext().env as { FORM_QUOTA?: QuotaNamespace }).FORM_QUOTA;
    if (!ns) return { ok: true };
    return await ns.get(ns.idFromName("public-forms")).take(ip);
  } catch (error) {
    if (process.env.NODE_ENV === "production") console.error("[forms] 上限を数えられませんでした", error);
    return { ok: true };
  }
}
