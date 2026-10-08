import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

/* ------------------------------------------------------------------
   Cloudflare Workers での Next.js のキャッシュ。置き場所は wrangler.jsonc。

   - incrementalCache: 作ったページ（ISR）を R2 に置く
   - tagCache:         revalidatePath / revalidateTag の印を D1 に置く
   - queue:            古くなったページの作り直しを Durable Objects で順番に回す

   enableCacheInterception は、キャッシュにあるページを Next.js の本体を起こさずに
   返す。無料プランは 1 アクセスの CPU が 10ms までなので、ここで稼ぐ。
   ------------------------------------------------------------------ */

export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  tagCache: d1NextTagCache,
  queue: doQueue,
  enableCacheInterception: true,
});
