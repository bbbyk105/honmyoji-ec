// `.open-next/worker.js` はビルド（opennextjs-cloudflare build）で作られ、git に無い。
// 無いときに worker/index.ts の型を通すための宣言。あるときは実物の JS から推論される。
declare module "*/.open-next/worker.js" {
  const worker: {
    fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response>;
  };
  export default worker;
  export const DOQueueHandler: unknown;
  export const DOShardedTagCache: unknown;
  export const BucketCachePurge: unknown;
}
