/**
 * メールの鍵が無いときの一枚（ダッシュボードだけに出す）。
 *
 * 公開から 2026-09-29 まで、本番に通知の鍵が入っておらず、お問い合わせが一通も
 * お店に届いていなかった。お客さまの画面は「送れました」のままなので、誰も気づけない。
 * 毎日開く画面で言う。
 */
export function MailNotice() {
  return (
    <div className="mb-8 border border-clay/40 bg-clay/10 px-6 py-5">
      <p className="font-sans text-[15px] font-semibold text-clay">
        お問い合わせと注文の知らせが、どこにも届いていません
      </p>
      <p className="mt-2 max-w-[46em] font-sans text-[13.5px] leading-[1.9] text-bone">
        メールの設定がありません。お客さまの画面には「送れました」と出ますが、中身はサーバーの記録に残るだけです。
      </p>
      <p className="mt-2 max-w-[46em] font-sans text-[13px] leading-[1.9] text-mist">
        Vercel の環境変数に <code className="font-mono text-[12.5px]">RESEND_API_KEY</code>・
        <code className="font-mono text-[12.5px]">RESEND_FROM</code>・
        <code className="font-mono text-[12.5px]">NOTIFY_EMAILS</code>（受け取るアドレス。カンマ区切りで複数可）を入れて、
        デプロイし直してください。
      </p>
    </div>
  );
}

/**
 * DB に接続されていないとき（鍵が無い）の一枚。
 *
 * 空の表を見せて黙っているより、なぜ何も無いのかを書く。管理画面が読めない
 * のは事故ではなく、まだ鍵を入れていないだけ、ということが多い。
 */
export function DbNotice() {
  return (
    <div className="mb-8 border border-clay/40 bg-clay/10 px-6 py-5">
      <p className="font-sans text-[15px] font-semibold text-clay">データベースに接続されていません</p>
      <p className="mt-2 max-w-[46em] font-sans text-[13.5px] leading-[1.9] text-bone">
        いまは <code className="font-mono text-[12.5px]">data/products.ts</code> の値をそのまま表示しています。
        変更しても保存先がないので、値は残りません。
      </p>
      <p className="mt-2 max-w-[46em] font-sans text-[13px] leading-[1.9] text-mist">
        <code className="font-mono text-[12.5px]">.env.local</code> に{" "}
        <code className="font-mono text-[12.5px]">SUPABASE_URL</code> と{" "}
        <code className="font-mono text-[12.5px]">SUPABASE_SERVICE_ROLE_KEY</code> を入れ、
        <code className="mx-1 font-mono text-[12.5px]">supabase/migrations/</code>
        の SQL を番号順に Supabase の SQL Editor で流してください。
      </p>
    </div>
  );
}

/**
 * DB に一時的に接続できないとき（鍵はあるが読めない。Supabase の不調・自動停止など）。
 * 管理画面は縮退した値で編集させない —— 比べる元がずれ、保存が誤って断られるか、古い値で上書きする。
 */
export function DbDownNotice() {
  return (
    <div className="mb-8 border border-clay/40 bg-clay/10 px-6 py-5">
      <p className="font-sans text-[15px] font-semibold text-clay">データベースに一時的に接続できません</p>
      <p className="mt-2 max-w-[46em] font-sans text-[13.5px] leading-[1.9] text-bone">
        いまは変更できません。少し待ってから再読み込みしてください。続くときは、Supabase のダッシュボードで
        プロジェクトが止まっていないか（Paused）を確認してください。
      </p>
    </div>
  );
}
