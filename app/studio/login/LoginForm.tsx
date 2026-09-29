"use client";

import { useActionState } from "react";

import { signIn, type FormState } from "@/app/studio/actions";
import { Field, Notice, fieldClass } from "@/components/studio/Field";
import { BTN_SOLID } from "@/components/studio/shell";

/**
 * ログインは `<form action>` のままでいい —— 通れば redirect で画面ごと替わり、
 * 失敗したときに欄が空に戻るのはむしろ望ましい（パスワードを残さない）。
 */
export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="next" value={next} />

      <Field label="メールアドレス" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoFocus
          required
          aria-invalid={Boolean(state.error)}
          className={fieldClass}
        />
      </Field>

      <Field label="パスワード" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(state.error)}
          className={fieldClass}
        />
      </Field>

      <Notice error={state.error} />

      <button type="submit" disabled={pending} className={`${BTN_SOLID} w-full`}>
        {pending ? "確認中…" : "ログイン"}
      </button>
    </form>
  );
}
