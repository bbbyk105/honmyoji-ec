"use server";

import { isEmail } from "@/lib/email";
import { notifyStore } from "@/lib/mail";

export type SubscribeState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "sent"; message: string };

/** 新作のお知らせの登録。お店にメールで届ける（Resend、`lib/mail.ts`）。 */
export async function subscribeNote(_prev: SubscribeState, formData: FormData): Promise<SubscribeState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!isEmail(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  try {
    await notifyStore({
      subject: "【MIROKU】新作のお知らせに登録がありました",
      text: [
        "新作のお知らせ（Notes from the temple）に登録がありました。",
        "",
        `メール: ${email}`,
        "",
        "新しい作品が出たら、このアドレスにお知らせを送ってください。",
      ].join("\n"),
      replyTo: email,
    });
  } catch (err) {
    console.error("[subscribe] failed", err);
    return { status: "error", message: "We could not keep your address. Please try again." };
  }

  return {
    status: "sent",
    message: "Noted. We will write when a new piece is ready.",
  };
}
