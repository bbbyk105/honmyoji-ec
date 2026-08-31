"use client";

import { useRef, useTransition } from "react";

import { setPieceStatus } from "@/app/studio/actions";
import { PIECE_STATUS_OPTIONS } from "@/app/studio/options";
import type { ProductStatus } from "@/data/products";

/**
 * 一覧のまま在庫を切り替える。
 *
 * 一点物なので「売れた」を記録する回数がいちばん多い。そのたびに詳細を開いて
 * 保存を押すのは、一日に何度もやる操作の重さではない。選んだ時点で送る。
 */
export function PieceStatusSelect({
  slug,
  status,
  disabled,
}: {
  slug: string;
  status: ProductStatus;
  disabled?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => startTransition(() => setPieceStatus(formData))}
      className="relative"
    >
      <input type="hidden" name="slug" value={slug} />
      <select
        name="status"
        defaultValue={status}
        disabled={disabled || pending}
        aria-label={`${slug} のステータス`}
        onChange={() => formRef.current?.requestSubmit()}
        className={`w-full cursor-pointer appearance-none border border-line bg-paper py-2 pl-3 pr-8 font-sans text-[13px] text-ink outline-none transition-colors hover:border-sand focus:border-ink focus:ring-1 focus:ring-ink/15 disabled:cursor-wait ${
          pending ? "opacity-55" : ""
        }`}
      >
        {PIECE_STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-sans text-[10px] text-mist"
      >
        ▾
      </span>
    </form>
  );
}
