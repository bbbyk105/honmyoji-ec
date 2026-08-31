import { redirect } from "next/navigation";

import { STUDIO_SHELL } from "@/components/studio/shell";
import { passwordIsPlaintext, studioConfigured, verifySession } from "@/lib/studio-session";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

/**
 * 入口。メールアドレスとパスワードだけ。
 *
 * ここは cookie を持たない訪問者が proxy から送られてくる唯一の場所なので、
 * 「何のサイトの管理画面か」以上のことは書かない。
 */
export default async function StudioLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await verifySession()) redirect("/studio");

  const { next } = await searchParams;

  return (
    <div className={`${STUDIO_SHELL} flex min-h-screen items-center`}>
      <div className="w-full max-w-105 py-20">
        <p className="eyebrow">MIROKU</p>
        <h1 className="mt-5 font-display text-[clamp(34px,5vw,46px)] font-light leading-[1.05] text-ink">
          Studio
        </h1>
        <p className="mt-4 font-jp text-[12px] tracking-[0.24em] text-mist">管理画面</p>

        {studioConfigured ? (
          <>
            <LoginForm next={next ?? "/studio"} />
            {passwordIsPlaintext ? (
              <p className="mt-8 border-t border-line pt-5 font-sans text-[12px] leading-[1.8] text-clay">
                パスワードが平文のまま環境変数に入っています。
                <code className="mx-1 font-mono text-[11.5px]">npm run studio:secrets</code>
                でハッシュに移してください。
              </p>
            ) : null}
          </>
        ) : (
          <div className="mt-10 border border-clay/60 bg-paper px-5 py-5">
            <p className="font-sans text-[13px] leading-[1.9] text-clay">
              まだアカウントが設定されていません。
              <code className="mx-1 font-mono">npm run studio:secrets</code>
              で鍵を作り、<code className="font-mono">.env.local</code> に入れてから開いてください。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
