import "server-only";

import { site } from "@/data/site";

/* ------------------------------------------------------------------
   お店への知らせと、お客さまへの注文の確認（Resend）。**サーバ専用** —— API キーを client に渡さない。

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

  await send(notifyRecipients, mail);
}

/** Resend に一通頼む。失敗したら投げる。 */
async function send(to: string[], mail: Mail): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      subject: mail.subject,
      text: mail.text,
      // Resend のフィールド名は snake_case
      ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new MailError(res.status, `Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}

/** Resend が断った。status は HTTP の状態コード。 */
export class MailError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "MailError";
  }
}

/**
 * 送り直しても届かない失敗か（宛先の誤り・送り元の認証切れ・試験用アドレスなど、4xx。429 の
 * 枠切れは除く）。Webhook はこれを「送れない」と記録して先へ進む —— 再送させても毎回落ち、
 * Stripe が 3 日再送し続けるだけになる。タイムアウトや 5xx は一時的なので送り直す。
 */
export function isPermanentMailError(error: unknown): boolean {
  return error instanceof MailError && error.status >= 400 && error.status < 500 && error.status !== 429;
}

/**
 * お客さまに送る（注文の確認）。返信はお店の公開アドレス（`site.email`。Cloudflare の
 * Email Routing でお店の Gmail へ転送される）に届く —— 送り元の notify@ には受信箱が無い。
 *
 * 失敗しても投げない（Webhook を止めない。注文はもう保存できている）。鍵が無ければログだけ。
 */
/** お客さまに送る。**失敗したら投げる**（Webhook が「送り終えた」を記録してから次へ進むため）。 */
export async function sendToCustomer(to: string, mail: Mail): Promise<void> {
  if (!apiKey) {
    console.info(`[mail] RESEND_API_KEY が無いのでお客さまに送っていません: ${mail.subject}`);
    return;
  }
  await send([to], { replyTo: site.email, ...mail });
}

/** 知らせるだけで、失敗しても呼び出し元を止めない（Webhook・ログイン通知）。 */
export async function notifyStoreQuietly(mail: Mail): Promise<void> {
  try {
    await notifyStore(mail);
  } catch (error) {
    console.error("[mail] 送れませんでした", mail.subject, error);
  }
}

