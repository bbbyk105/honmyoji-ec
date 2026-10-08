/* ------------------------------------------------------------------
   Worker の入口。OpenNext が作る `.open-next/worker.js` をそのまま包み、
   定期実行（scheduled）だけを足す。
   https://opennext.js.org/cloudflare/howtos/custom-worker

   `.open-next/` はビルド（`npm run deploy` の中の opennextjs-cloudflare build）で
   作られ、git には無い。無いときの型は worker/open-next.d.ts。
   ------------------------------------------------------------------ */

import openNext from "../.open-next/worker.js";

import { refuse } from "./guard";
import { pingDatabase, type KeepAliveEnv } from "./keep-alive";

const worker = {
  fetch(request: Request, env: unknown, ctx: unknown): Promise<Response> {
    const refused = refuse(request);
    return refused ? Promise.resolve(refused) : openNext.fetch(request, env, ctx);
  },

  /** `wrangler.jsonc` の triggers.crons（一日一回）。Supabase を眠らせない。 */
  async scheduled(_controller: unknown, env: KeepAliveEnv): Promise<void> {
    try {
      const status = await pingDatabase(env);
      console.info(
        status === null ? "[keep-alive] SUPABASE_* が無いので何もしない" : `[keep-alive] Supabase ${status}`,
      );
    } catch (error) {
      console.error("[keep-alive] Supabase を読めませんでした", error);
      throw error;
    }
  },
};

export default worker;

// open-next.config.ts の queue（DOQueueHandler）などの Durable Object。入口を替えても export し続ける
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "../.open-next/worker.js";
// 公開フォームの一日の上限（lib/form-quota.ts）
export { FormQuota } from "./form-quota-object";
