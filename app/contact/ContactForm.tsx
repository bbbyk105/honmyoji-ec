"use client";

import { useActionState, useId } from "react";
import { Button } from "@/components/site/Button";
import { sendInquiry, type ContactState } from "./actions";

type Props = {
  product?: { slug: string; name: string; kanji: string } | null;
  subject: string;
  subjects: { value: string; label: string }[];
};

/**
 * 入力欄は「紙の升目」として見せる。罫線一本だけの欄は綺麗だが、
 * どこを触ればいいのか分からない（＝手紙用紙の枠がない）ので面を持たせている。
 */
const field =
  "w-full border border-line bg-paper px-4 py-3.5 font-sans text-[15px] leading-[1.6] text-ink outline-none transition-colors placeholder:text-mist/80 hover:border-sand focus:border-ink focus:ring-1 focus:ring-ink/15 aria-[invalid=true]:border-clay";
const label = "block font-sans text-[11px] font-medium uppercase tracking-[0.16em] text-charcoal";
const hint = "mt-2 font-sans text-[12px] leading-[1.6] text-clay";

export function ContactForm({ product, subject, subjects }: Props) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendInquiry, { status: "idle" });
  const uid = useId();

  if (state.status === "sent") {
    return (
      <div className="border border-line bg-paper px-6 py-10 sm:px-10 sm:py-12">
        <p className="font-display text-[34px] font-light leading-[1.2] text-ink">Sent.</p>
        <p className="mt-4 max-w-[44ch] font-sans text-[14px] leading-[1.9] text-charcoal">{state.message}</p>
      </div>
    );
  }

  const errors = state.status === "error" ? state.errors ?? {} : {};
  const err = (k: "name" | "email" | "message") => errors[k];

  return (
    <form action={action} className="space-y-7" noValidate>
      {product ? (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border border-line bg-paper px-4 py-4">
          <span className="font-sans text-[10.5px] uppercase tracking-[0.2em] text-mist">Piece</span>
          <span className="font-display text-[22px] font-light text-ink">
            {product.name}
            <span className="ml-2 font-jp text-[12px] tracking-[0.3em] text-mist">{product.kanji}</span>
          </span>
          <span className="font-sans text-[12.5px] text-mist">/{product.slug}</span>
          <input type="hidden" name="product" value={`${product.name} (${product.slug})`} />
        </div>
      ) : null}

      <div>
        <label htmlFor="subject" className={label}>
          Subject
        </label>
        <div className="relative mt-2">
          <select
            id="subject"
            name="subject"
            defaultValue={subject}
            className={`${field} cursor-pointer appearance-none pr-11`}
          >
            {subjects.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <span
            aria-hidden
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-sans text-[11px] text-mist"
          >
            ▾
          </span>
        </div>
      </div>

      <div className="grid gap-7 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={label}>
            Name
          </label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            required
            aria-invalid={Boolean(err("name"))}
            aria-describedby={err("name") ? `${uid}-name` : undefined}
            className={`${field} mt-2`}
            placeholder="Your name"
          />
          {err("name") ? (
            <p id={`${uid}-name`} className={hint}>
              {err("name")}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="email" className={label}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(err("email"))}
            aria-describedby={err("email") ? `${uid}-email` : undefined}
            className={`${field} mt-2`}
            placeholder="you@example.com"
          />
          {err("email") ? (
            <p id={`${uid}-email`} className={hint}>
              {err("email")}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="message" className={label}>
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={7}
          required
          aria-invalid={Boolean(err("message"))}
          aria-describedby={err("message") ? `${uid}-message` : undefined}
          className={`${field} mt-2 resize-y leading-[1.8]`}
          placeholder={
            subject === "custom"
              ? "Shape, size, what you will carry in it, colours you love, when you need it…"
              : "Anything you would like to ask or tell us."
          }
        />
        {err("message") ? (
          <p id={`${uid}-message`} className={hint}>
            {err("message")}
          </p>
        ) : null}
      </div>

      {/* honeypot */}
      <div className="hidden" aria-hidden>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === "error" ? (
        <p role="alert" className="border border-clay/60 bg-paper px-4 py-3.5 font-sans text-[13px] leading-[1.7] text-clay">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-line pt-7">
        <Button type="submit" variant="solid" arrow={!pending} disabled={pending}>
          {pending ? "Sending…" : "Send"}
        </Button>
        <p className="max-w-[34ch] font-sans text-[12px] leading-[1.7] text-mist">
          No account, no newsletter. We only use your address to answer you.
        </p>
      </div>
    </form>
  );
}
