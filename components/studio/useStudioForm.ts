"use client";

import { useState, useTransition, type FormEvent } from "react";

import type { FormState } from "@/app/studio/actions";

/**
 * 管理画面の保存フォーム。**`<form action={…}>` に渡さず、onSubmit から呼ぶ**。
 *
 * React 19 は form の action が終わると、その form の制御していない欄を初期値に
 * 戻す。input と textarea は保存後の値が初期値として届くので戻っても見た目は同じだが、
 * **select だけは描いた後に初期値を差し替えられない**。保存は通っているのに、選択欄は
 * 保存前の値（例えば「完売」）に戻って見え、「切り替えられない」と言われた（2026-09-29）。
 * onSubmit で自分で送れば form は戻されない。
 */
export function useStudioForm(action: (prev: FormState, formData: FormData) => Promise<FormState>) {
  const [state, setState] = useState<FormState>({});
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const next = await action(state, formData);
      startTransition(() => setState(next));
    });
  }

  return { state, pending, onSubmit };
}
