"use client";

import { useActionState } from "react";

import { savePiece, type FormState } from "@/app/studio/actions";
import { PIECE_STATUS_OPTIONS } from "@/app/studio/options";
import { Field, Notice, Select, fieldClass } from "@/components/studio/Field";
import { Button } from "@/components/site/Button";
import type { Override } from "@/lib/catalog";
import type { Product } from "@/data/products";

/**
 * 一点の編集。
 *
 * 空欄は「消す」ではなく「コード側の値を使う」。だから placeholder には
 * data/products.ts の値をそのまま出す —— 何も入れなければこれが出る、が
 * 見えていないと、上書きしているのかどうかが分からなくなる。
 */
export function PieceForm({
  base,
  override,
  disabled,
}: {
  /** data/products.ts の値（上書き前） */
  base: Product;
  override: Override | undefined;
  disabled: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePiece, {});

  return (
    <form action={action} className="space-y-8 pb-6">
      <input type="hidden" name="slug" value={base.slug} />

      <div className="grid gap-8 sm:grid-cols-2">
        <Field
          label="価格（AUD）"
          htmlFor="price_aud"
          hint={`空欄ならコード側の A$${base.priceAud}`}
        >
          <input
            id="price_aud"
            name="price_aud"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            disabled={disabled}
            defaultValue={override?.price_aud ?? ""}
            placeholder={String(base.priceAud)}
            className={`${fieldClass} tabular-nums`}
          />
        </Field>

        <Field label="ステータス" htmlFor="status">
          <Select id="status" name="status" defaultValue={override?.status ?? ""} disabled={disabled}>
            <option value="">コード側のまま（{base.status}）</option>
            {PIECE_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="一言（英語）" htmlFor="note" hint="一覧カードと詳細ページの副題。一文で。">
        <textarea
          id="note"
          name="note"
          rows={2}
          disabled={disabled}
          defaultValue={override?.note ?? ""}
          placeholder={base.note}
          className={`${fieldClass} resize-y`}
        />
      </Field>

      <Field label="一言（日本語）" htmlFor="note_ja">
        <textarea
          id="note_ja"
          name="note_ja"
          rows={2}
          disabled={disabled}
          defaultValue={override?.note_ja ?? ""}
          placeholder={base.noteJa}
          className={`${fieldClass} resize-y font-jp`}
        />
      </Field>

      <Field label="作品の物語（英語）" htmlFor="story" hint="詳細ページの本文。">
        <textarea
          id="story"
          name="story"
          rows={5}
          disabled={disabled}
          defaultValue={override?.story ?? ""}
          placeholder={base.story}
          className={`${fieldClass} resize-y leading-[1.85]`}
        />
      </Field>

      <Field label="作品の物語（日本語）" htmlFor="story_ja">
        <textarea
          id="story_ja"
          name="story_ja"
          rows={4}
          disabled={disabled}
          defaultValue={override?.story_ja ?? ""}
          placeholder={base.storyJa}
          className={`${fieldClass} resize-y font-jp leading-[1.95]`}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-x-7 gap-y-4 border-t border-line pt-7">
        <Button type="submit" variant="solid" disabled={disabled || pending} arrow={false}>
          {pending ? "保存中" : "保存する"}
        </Button>
        <Notice error={state.error} saved={state.saved} />
      </div>
    </form>
  );
}
