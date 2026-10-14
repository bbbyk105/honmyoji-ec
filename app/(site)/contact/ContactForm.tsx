"use client";

import { startTransition, useActionState, useId, useState, type FormEvent } from "react";
import { Button } from "@/components/site/Button";
import { Turnstile } from "@/components/site/Turnstile";
import { TURNSTILE_FIELD } from "@/lib/turnstile-field";
import { sendInquiry, type ContactState } from "./actions";

type Props = {
  /** 確認（Turnstile）が動かないときに案内する宛先 */
  email: string;
  product?: { slug: string; name: string; kanji: string } | null;
  subject: string;
  subjects: { value: string; label: string }[];
};

/**
 * 入力欄は「紙の升目」として見せる。罫線一本だけの欄は綺麗だが、
 * どこを触ればいいのか分からない（＝手紙用紙の枠がない）ので面を持たせている。
 */
const field =
  "w-full border border-bark bg-transparent px-4 py-4 font-sans text-[16px] leading-[1.6] text-ivory outline-none transition-colors duration-500 placeholder:text-mist hover:border-ivory/60 focus:border-ivory aria-[invalid=true]:border-clay";
/* ラベルは文と同じ書き方で。大文字・字間の広い 11px は、フォームを書類に見せていた */
const label = "block font-sans text-meta font-medium text-bone";
const hint = "mt-2 font-sans text-meta text-clay";

export function ContactForm({ email, product, subject, subjects }: Props) {
  const [state, dispatch, pending] = useActionState<ContactState, FormData>(sendInquiry, { status: "idle" });
  const uid = useId();

  /*
    JS を読み終えたあとは onSubmit から送る。React 19 は form の action が終わると制御していない
    欄を初期値に戻すので、入力漏れや確認（Turnstile）で断られるたびに、書いた本文が空に、件名が
    最初の値に戻っていた（components/studio/useStudioForm.ts と同じ話）。onSubmit で
    preventDefault すると React は action を呼ばず、form も戻さない。

    **action も外さない**。読み終える前（hydration の前）に押されたとき、action の無い form は
    素の GET で `/contact?name=…&message=…` へ送り、名前・メール・本文が URL と履歴とログに残る。
    action があれば React がサーバーで POST の form を描く（確認の印が無いので断られるが、漏れない）。
  */
  // 確認の印がまだ無い（確認の途中・チェックボックスを押す前）うちに押されたときの案内
  const [waiting, setWaiting] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    // 印が無いまま送っても必ず断られる（サーバーは印を使わずに断る）。送らずに待ってもらう
    if (!formData.get(TURNSTILE_FIELD)) {
      setWaiting(true);
      return;
    }
    setWaiting(false);
    startTransition(() => dispatch(formData));
  }

  /*
    印を取り直すのは、サーバーが印を使ったあとで断ったとき（tokenSpent: 確認・一日の上限・送信の失敗）だけ。
    入力漏れや印が届かなかったときは、印を使う前に断っているので取り直さない
    （取り直すと、確認の途中の人はやり直しになる。components/site/Turnstile.tsx）。
  */
  const tokenSpent = state.status === "error" && state.tokenSpent ? state : null;
  const alert = waiting
    ? "One moment — the check above is still confirming you are a person. If a box appears, tick it, then send."
    : state.status === "error"
      ? state.message
      : null;

  if (state.status === "sent") {
    return (
      <div className="border border-line px-6 py-12 sm:px-10 sm:py-14">
        <p className="font-display text-section font-light text-ivory">Sent.</p>
        <p className="mt-5 max-w-[44ch] font-sans text-body text-bone">{state.message}</p>
      </div>
    );
  }

  const errors = state.status === "error" ? state.errors ?? {} : {};
  const err = (k: "name" | "email" | "message") => errors[k];

  return (
    <form action={dispatch} onSubmit={onSubmit} className="space-y-7" noValidate>
      {product ? (
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 border border-line px-5 py-5">
          <span className="font-sans text-meta text-mist">Piece</span>
          <span className="font-display text-[24px] font-light leading-tight text-ivory">
            {product.name}
            <span lang="ja" className="ml-2.5 font-jp text-[13px] tracking-[0.04em] text-mist">{product.kanji}</span>
          </span>
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
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-sans text-[12px] text-mist"
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

      <Turnstile action="contact" email={email} resetKey={tokenSpent} />

      {alert ? (
        <p role="alert" className="border border-clay/60 px-4 py-4 font-sans text-small text-clay">
          {alert}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-line pt-8">
        <Button type="submit" variant="solid" arrow={!pending} disabled={pending}>
          {pending ? "Sending…" : "Send"}
        </Button>
        <p className="max-w-[34ch] font-sans text-meta text-mist">
          No account, no newsletter. We only use your address to answer you.
        </p>
      </div>
    </form>
  );
}
