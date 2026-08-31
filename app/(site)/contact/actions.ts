"use server";

import { SUBJECTS } from "./subjects";

export type ContactState =
  | { status: "idle" }
  | { status: "error"; message: string; errors?: Partial<Record<"name" | "email" | "message", string>> }
  | { status: "sent"; message: string };

/**
 * お問い合わせ送信。TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID があれば Telegram に転送、
 * 無ければサーバーログに出す（ローカル開発用）。
 */
export async function sendInquiry(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "other");
  const product = String(formData.get("product") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const honeypot = String(formData.get("website") ?? "");

  if (honeypot) return { status: "sent", message: "Thank you — we will write back soon." };

  const errors: NonNullable<Extract<ContactState, { status: "error" }>["errors"]> = {};
  if (name.length < 1) errors.name = "Please tell us your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email address.";
  if (message.length < 10) errors.message = "A few more words would help us answer well.";
  if (Object.keys(errors).length) {
    return { status: "error", message: "Please check the highlighted fields.", errors };
  }

  const lines = [
    `📿 MIROKU — ${SUBJECTS[subject] ?? subject}`,
    product ? `Piece: ${product}` : null,
    `From: ${name} <${email}>`,
    "",
    message,
  ].filter((l): l is string => l !== null);
  const text = lines.join("\n");

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  try {
    if (token && chatId) {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      if (!res.ok) throw new Error(`telegram ${res.status}`);
    } else {
      console.info("[contact] (no TELEGRAM_* env — logging only)\n" + text);
    }
  } catch (err) {
    console.error("[contact] failed", err);
    return {
      status: "error",
      message: "We could not send your message. Please try again, or email us directly.",
    };
  }

  return {
    status: "sent",
    message:
      subject === "reserve"
        ? "Thank you. We are holding the piece for you and will reply within a day with payment details."
        : "Thank you — a person at the temple will write back within a day or two.",
  };
}
