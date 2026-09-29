import { redirect } from "next/navigation";

import { STUDIO_CARD, STUDIO_SHELL } from "@/components/studio/shell";
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
    <div className={`${STUDIO_SHELL} flex min-h-screen items-center justify-center`}>
      <div className="w-full max-w-105 py-20">
        <p className="font-mark text-[26px] font-light leading-none tracking-[0.02em] text-ivory">MIROKU</p>
        <h1 className="mt-3 font-sans text-[15px] text-mist">管理画面</h1>

        <div className={`mt-8 ${STUDIO_CARD} px-6 py-7`}>
          {studioConfigured ? (
            <>
              <LoginForm next={next ?? "/studio"} />
              {passwordIsPlaintext ? (
                <p className="mt-6 border-t border-line pt-5 font-sans text-[12.5px] leading-[1.8] text-clay">
                  パスワードが平文のまま環境変数に入っています。
                  <code className="mx-1 font-mono text-[12px]">npm run studio:secrets</code>
                  でハッシュに移してください。
                </p>
              ) : null}
            </>
          ) : (
            <p className="font-sans text-[13.5px] leading-[1.9] text-clay">
              まだアカウントが設定されていません。
              <code className="mx-1 font-mono">npm run studio:secrets</code>
              で鍵を作り、<code className="font-mono">.env.local</code> に入れてから開いてください。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
