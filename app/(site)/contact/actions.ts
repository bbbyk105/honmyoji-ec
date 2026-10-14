"use server";

import { site } from "@/data/site";
import { clientIp, limitKey } from "@/lib/client-ip";
import { isEmail } from "@/lib/email";
import { takeFormQuota } from "@/lib/form-quota-gate";
import { notifyStore } from "@/lib/mail";
import { salesSignals } from "@/lib/sales-pitch";
import { siteUrl } from "@/lib/site-url";
import { TURNSTILE_FIELD, verifyTurnstile } from "@/lib/turnstile";

import { SUBJECTS } from "./subjects";

export type ContactState =
  | { status: "idle" }
  | { status: "error"; message: string; errors?: Partial<Record<"name" | "email" | "message", string>> }
  | { status: "sent"; message: string };

/**
 * フォームの `product`（`Hishi · Kago (hishi-diamond,kago-basket)`、ContactForm が組む）
 * を、名前と slug に分ける。お客さまが書き換えられる欄なので、slug の形をしたものだけ
 * リンクにする。括弧が無ければ書かれたままを名前として出す。
 */
function parsePiece(product: string): { names: string; slugs: string[] } | null {
  if (!product) return null;
  const match = /\(([^()]*)\)\s*$/.exec(product);
  if (!match) return { names: product.slice(0, 120), slugs: [] };
  const slugs = match[1]
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-z0-9-]{1,60}$/.test(s));
  return { names: product.slice(0, match.index).trim() || slugs.join(", "), slugs };
}

/** 名前と本文の上限。本文はお店へのメール一通にそのまま載るので、長すぎるものを断る。 */
const NAME_MAX = 120;
const MESSAGE_MAX = 5000;

/** 一日の上限に達したとき。メールは直接なら届く（info@ → お店の Gmail）。 */
const FORM_LIMIT_MESSAGE = `We have received many messages today. Please email us directly at ${site.email} — a person reads every one.`;

/** 人が送っているかを確かめられなかったとき（lib/turnstile.ts）。直接のメールなら届く。 */
const CHECK_FAILED_MESSAGE = `We could not confirm this was sent by a person. Please try again, or email us directly at ${site.email}.`;

/**
 * 営業らしいものに付ける件名の印。お店の Gmail はこの語でフィルタして別のラベルへ振り分ける。
 * export しない（"use server" のファイルから関数以外を出すと 500 になる）。
 */
const SALES_LABEL = "【営業の可能性】";

/**
 * お問い合わせ送信。お店にメールで届ける（Resend、`lib/mail.ts`）。返信先はお客さまの
 * アドレスなので、お店は返信を押すだけで答えられる。鍵が無ければサーバーログに出す。
 */
export async function sendInquiry(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "other");
  const product = String(formData.get("product") ?? "").trim().slice(0, 300);
  const message = String(formData.get("message") ?? "").trim();
  const honeypot = String(formData.get("website") ?? "");

  if (honeypot) return { status: "sent", message: "Thank you — we will write back soon." };

  const errors: NonNullable<Extract<ContactState, { status: "error" }>["errors"]> = {};
  if (name.length < 1) errors.name = "Please tell us your name.";
  else if (name.length > NAME_MAX) errors.name = "Please shorten your name.";
  if (!isEmail(email)) errors.email = "Please enter a valid email address.";
  if (message.length < 10) errors.message = "A few more words would help us answer properly.";
  else if (message.length > MESSAGE_MAX) errors.message = `Please keep the message under ${MESSAGE_MAX} characters.`;
  if (Object.keys(errors).length) {
    return { status: "error", message: "Please check the highlighted fields.", errors };
  }

  const ip = await clientIp();

  // 人が送っているか（Cloudflare Turnstile）。上限より先に見る —— bot がサイト全体の
  // 一日の枠（50 通）を使い切ると、お客さまが送れなくなる
  const check = await verifyTurnstile(String(formData.get(TURNSTILE_FIELD) ?? ""), { action: "contact", ip });
  if (!check.ok) return { status: "error", message: CHECK_FAILED_MESSAGE };

  // 一日の上限（lib/form-quota.ts）。形の整ったものだけ数える
  const quota = await takeFormQuota(limitKey(ip));
  if (!quota.ok) return { status: "error", message: FORM_LIMIT_MESSAGE };

  const topic = SUBJECTS[subject] ?? subject;
  const piece = parsePiece(product);
  // 営業らしいものも捨てずに届ける（卸の相談などを落とさない）。件名に印を付けて分けるだけ
  const signals = salesSignals(name, message);
  const text = [
    ...(signals.length ? [`※ 営業・売り込みの可能性があります（${signals.join("・")}）。`, ""] : []),
    `${name} さんからお問い合わせがありました。`,
    "このメールに返信すると、そのままお客さまに届きます。",
    "",
    `件名: ${topic}`,
    `お名前: ${name}`,
    `メール: ${email}`,
    ...(piece ? [`作品: ${piece.names}`, ...piece.slugs.map((slug) => `  ${siteUrl(`/collection/${slug}`)}`)] : []),
    "",
    "―――――― 本文 ――――――",
    message,
  ].join("\n");

  try {
    await notifyStore({
      subject: `【MIROKU】${signals.length ? SALES_LABEL : ""}お問い合わせ — ${topic}（${name}）`,
      text,
      replyTo: email,
    });
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
