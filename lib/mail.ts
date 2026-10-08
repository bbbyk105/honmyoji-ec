import "server-only";

import { site } from "@/data/site";

/* ------------------------------------------------------------------
   お店への知らせ（Resend）。**サーバ専用** —— API キーを client に渡さない。

   以前は Telegram に送っていたが、本番に TELEGRAM_* が入っておらず、公開から
   2026-09-29 までお問い合わせが一通もお店に届いていなかった（ログに残るだけ）。
   お店が受け取る知らせはメールにする。送り方は fujisan と同じ素の fetch。

     RESEND_API_KEY  Resend の API キー
     RESEND_FROM     送信元（例: `MIROKU <notify@example.com>`）。Resend で認証した
                     ドメインのアドレス。未設定なら Resend の試験用アドレスで、これは
                     Resend のアカウントの持ち主にしか届かない
     NOTIFY_EMAILS   受け取るアドレス。カンマ区切りで複数可

   鍵か宛先が無いときは送らずにログへ出す（ローカル開発）。本番でそうなっていると
   お店に何も届かないので、管理画面のダッシュボードが `mailEnabled` を見て警告する。
   ------------------------------------------------------------------ */

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM || "MIROKU <onboarding@resend.dev>";

/** 受け取るアドレス。空白と空要素は落とす。 */
export const notifyRecipients: string[] = (process.env.NOTIFY_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** 鍵と宛先が揃っているか。 */
export const mailEnabled = Boolean(apiKey && notifyRecipients.length > 0);

export type Mail = {
  subject: string;
  text: string;
  /**
   * 返信先。お問い合わせではお客さまのアドレスを入れる —— お店はそのまま
   * 「返信」を押すだけでお客さまに届く。
   */
  replyTo?: string;
};

/**
 * お店に送る。**失敗したら投げる**（お問い合わせは、届かなかったことを
 * お客さまに伝えたいので）。止めたくない呼び出し元は `notifyStoreQuietly` を使う。
 */
export async function notifyStore(mail: Mail): Promise<void> {
  if (!mailEnabled) {
    // 本番でここに来るのは設定漏れ。warn だと埋もれるので error で残す。
    const log = process.env.NODE_ENV === "production" ? console.error : console.info;
    log(
      `[mail] RESEND_API_KEY / NOTIFY_EMAILS が無いので送っていません\n  subject: ${mail.subject}\n${mail.text}`,
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: notifyRecipients,
      subject: mail.subject,
      text: mail.text,
      // Resend のフィールド名は snake_case
      ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}

/** 知らせるだけで、失敗しても呼び出し元を止めない（Webhook・ログイン通知）。 */
export async function notifyStoreQuietly(mail: Mail): Promise<void> {
  try {
    await notifyStore(mail);
  } catch (error) {
    console.error("[mail] 送れませんでした", mail.subject, error);
  }
}

/**
 * 本文の下に付ける、管理画面への絶対 URL。`NEXT_PUBLIC_SITE_URL` が無ければ
 * 本番のドメイン（`site.url`）。
 */
export function siteLink(path: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || site.url).replace(/\/$/, "");
  return `${base}${path}`;
}
