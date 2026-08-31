"use client";

import { useActionState } from "react";

import { updateOrder, type FormState } from "@/app/studio/actions";
import { ORDER_STATUS_OPTIONS } from "@/app/studio/options";
import { Field, Notice, Select, fieldClass } from "@/components/studio/Field";
import { Button } from "@/components/site/Button";
import type { Order } from "@/lib/orders";

export function OrderForm({ order }: { order: Order }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateOrder, {});

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="id" value={order.id} />

      <Field
        label="状態"
        htmlFor="status"
        hint="「Shipped」を選んで保存した時刻が発送日になります。"
      >
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

      <Field label="覚え書き" htmlFor="memo" hint="お客さんには見えません。">
        <textarea
          id="memo"
          name="memo"
          rows={4}
          defaultValue={order.memo ?? ""}
          className={`${fieldClass} resize-y font-jp leading-[1.95]`}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-x-7 gap-y-4 border-t border-line pt-7">
        <Button type="submit" variant="solid" disabled={pending} arrow={false}>
          {pending ? "保存中" : "保存する"}
        </Button>
        <Notice error={state.error} saved={state.saved} />
      </div>
    </form>
  );
}
