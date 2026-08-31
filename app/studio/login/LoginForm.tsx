"use client";

import { useActionState } from "react";

import { signIn, type FormState } from "@/app/studio/actions";
import { Field, Notice, fieldClass } from "@/components/studio/Field";
import { Button } from "@/components/site/Button";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});

  return (
    <form action={action} className="mt-10 space-y-6">
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

      <Button type="submit" variant="solid" disabled={pending} arrow={false}>
        {pending ? "確認中" : "入る"}
      </Button>
    </form>
  );
}
