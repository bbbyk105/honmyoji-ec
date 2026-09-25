"use client";

import { useActionState } from "react";
import { subscribeNote, type SubscribeState } from "@/app/subscribe/actions";
import { Arrow } from "./Arrow";

const initial: SubscribeState = { status: "idle" };

export function Newsletter() {
  const [state, action, pending] = useActionState(subscribeNote, initial);

  if (state.status === "sent") {
    return (
      <p className="font-sans text-small text-bone">{state.message}</p>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      <label htmlFor="note-email" className="block font-display text-[21px] font-light leading-tight text-ivory">
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
          className="min-w-0 flex-1 bg-transparent py-3 font-sans text-[15px] text-ivory outline-none placeholder:text-mist"
        />
        <button
          type="submit"
          disabled={pending}
          className="cta caps flex min-h-11 shrink-0 items-center gap-4 text-ivory disabled:opacity-50"
        >
          <span className="cta-label">{pending ? "Sending" : "Send"}</span>
          {pending ? null : <Arrow className="cta-arrow" />}
        </button>
      </div>
      {state.status === "error" ? (
        <p className="font-sans text-meta text-clay">{state.message}</p>
      ) : (
        <p className="font-sans text-meta text-mist">
          A letter when a new piece is finished. Nothing else.
        </p>
      )}
    </form>
  );
}
