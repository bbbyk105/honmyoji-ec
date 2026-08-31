"use client";

import { useActionState } from "react";
import { subscribeNote, type SubscribeState } from "@/app/subscribe/actions";

const initial: SubscribeState = { status: "idle" };

export function Newsletter() {
  const [state, action, pending] = useActionState(subscribeNote, initial);

  if (state.status === "sent") {
    return (
      <p className="font-sans text-[13px] leading-[1.8] text-charcoal/85">{state.message}</p>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      <label htmlFor="note-email" className="block font-sans text-[9.5px] uppercase tracking-[0.26em] text-mist">
        Notes from the temple
      </label>
      <div className="flex items-end gap-4 border-b border-line">
        <input
          id="note-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email"
          className="min-w-0 flex-1 bg-transparent py-2.5 font-sans text-[14px] text-ink outline-none placeholder:text-mist/60"
        />
        <button
          type="submit"
          disabled={pending}
          className="cta mb-1 flex min-h-11 shrink-0 items-center gap-2 font-sans text-[10.5px] font-medium uppercase tracking-[0.2em] text-ink underline decoration-ink/40 underline-offset-[6px] transition-colors hover:decoration-ink disabled:opacity-50"
        >
          {pending ? "…" : "Send"}
          {pending ? null : (
            <span aria-hidden className="cta-arrow leading-none">
              →
            </span>
          )}
        </button>
      </div>
      {state.status === "error" ? (
        <p className="font-sans text-[11px] text-clay">{state.message}</p>
      ) : (
        <p className="font-sans text-[11px] leading-[1.7] text-mist">
          A letter when a new piece is finished. Nothing else.
        </p>
      )}
    </form>
  );
}
