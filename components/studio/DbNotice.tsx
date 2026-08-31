/**
 * DB に繋がっていないときの一枚。
 *
 * 空の表を見せて黙っているより、なぜ何も無いのかを書く。管理画面が読めない
 * のは事故ではなく、まだ鍵を入れていないだけ、ということが多い。
 */
export function DbNotice() {
  return (
    <div className="mt-10 border border-line bg-paper px-6 py-7">
      <p className="font-display text-[24px] font-light leading-[1.25] text-ink">
        データベースに繋がっていません
      </p>
      <p className="mt-3 max-w-[42em] font-sans text-[13.5px] leading-[1.9] text-charcoal">
        いまは <code className="font-mono text-[12.5px]">data/products.ts</code> の値をそのまま表示しています。
        編集して保存することはできますが、保存先がないので値は残りません。
      </p>
      <p className="mt-4 max-w-[42em] font-sans text-[13px] leading-[1.9] text-mist">
        <code className="font-mono text-[12.5px]">.env.local</code> に{" "}
        <code className="font-mono text-[12.5px]">SUPABASE_URL</code> と{" "}
        <code className="font-mono text-[12.5px]">SUPABASE_SERVICE_ROLE_KEY</code> を入れ、
        <code className="mx-1 font-mono text-[12.5px]">supabase/migrations/0001_studio.sql</code>
        を Supabase の SQL Editor で流してください。
      </p>
    </div>
  );
}
