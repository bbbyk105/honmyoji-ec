import { notifyStoreQuietly } from "@/lib/mail";

/* ------------------------------------------------------------------
   /studio の出来事をお店にメールで知らせる（Resend、`lib/mail.ts`）。**サーバ専用**。

   送れなくてもログインは失敗させない。知らせるのは「入られた」と「締め出した」の
   二つだけ。毎回の失敗まで送ると通知が慣れになって、本当に危ないときに読まれなくなる。
   ------------------------------------------------------------------ */

export async function notifyStudio(text: string): Promise<void> {
  await notifyStoreQuietly({
    subject: `【MIROKU 管理画面】${text.replace(/^MIROKU Studio — /, "").slice(0, 60)}`,
    text: [
      text,
      "",
      "身に覚えがなければ、STUDIO_SESSION_SECRET を作り直して全員のログインを切り、",
      "パスワードを変えてください（手順は docs/studio.md）。",
    ].join("\n"),
  });
}
