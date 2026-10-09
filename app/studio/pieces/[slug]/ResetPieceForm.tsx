"use client";

import { resetPiece } from "@/app/studio/actions";
import { Notice } from "@/components/studio/Field";
import { BTN_QUIET } from "@/components/studio/shell";
import { useStudioForm } from "@/components/studio/useStudioForm";

/** 上書きの取り消し。失敗は画面に返す（黙って何も変わらない、にしない）。 */
export function ResetPieceForm({ slug, updatedAt, soldOut }: { slug: string; updatedAt: string; soldOut: boolean }) {
  const { state, pending, onSubmit } = useStudioForm(resetPiece);

  return (
    <form onSubmit={onSubmit} className="mt-6 px-1">
      <input type="hidden" name="slug" value={slug} />
      <p className="font-sans text-[13px] leading-[1.8] text-mist">
        この画面で上書き中 — 最終更新{" "}
        <time dateTime={updatedAt} className="tabular-nums">
          {new Date(updatedAt).toLocaleString("ja-JP", {
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </p>
      <button type="submit" disabled={pending} className={`mt-2 ${BTN_QUIET} text-clay`}>
        {pending ? "取り消し中…" : "上書きをすべて取り消してコード側に戻す"}
      </button>
      {soldOut ? (
        <p className="mt-2 font-sans text-[12.5px] leading-[1.8] text-mist">
          完売のステータスは残ります（売れた一点物がまた買えるようにならないため）。販売に戻すときは、ステータスを選び直して保存してください。
        </p>
      ) : null}
      <div className="mt-3">
        <Notice error={state.error} saved={state.saved} />
      </div>
    </form>
  );
}
