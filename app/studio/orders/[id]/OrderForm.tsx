"use client";

import { updateOrder } from "@/app/studio/actions";
import { ORDER_STATUS_OPTIONS } from "@/app/studio/options";
import { Field, Notice, Select, fieldClass } from "@/components/studio/Field";
import { BTN_SOLID } from "@/components/studio/shell";
import { useStudioForm } from "@/components/studio/useStudioForm";
import type { Order } from "@/lib/orders";

/** 送信は `useStudioForm`（onSubmit）。`<form action>` だと保存後に状態の欄が元の値に戻って見える。 */
export function OrderForm({ order }: { order: Order }) {
  const { state, pending, onSubmit } = useStudioForm(updateOrder);

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <input type="hidden" name="id" value={order.id} />

      <Field label="状態" htmlFor="status" hint="「発送済み」を選んで保存した時刻が発送日になります。">
        <Select id="status" name="status" defaultValue={order.status}>
          {ORDER_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="追跡番号" htmlFor="tracking" hint="EMS / 日本郵便の番号。控えとして残すだけです。">
        <input
          id="tracking"
          name="tracking"
          defaultValue={order.tracking ?? ""}
          placeholder="例: EE123456789JP"
          className={`${fieldClass} font-mono text-[14px] tracking-[0.04em]`}
        />
      </Field>

      <Field label="覚え書き" htmlFor="memo" hint="お客さまには見えません。">
        <textarea
          id="memo"
          name="memo"
          rows={4}
          defaultValue={order.memo ?? ""}
          className={`${fieldClass} resize-y leading-[1.95]`}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-line pt-7">
        <button type="submit" disabled={pending} className={BTN_SOLID}>
          {pending ? "保存中…" : "保存する"}
        </button>
        <Notice error={state.error} saved={state.saved} />
      </div>
    </form>
  );
}
