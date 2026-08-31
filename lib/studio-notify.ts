/* ------------------------------------------------------------------
   /studio の出来事を Telegram に送る。**サーバ専用**。

   お問い合わせと同じ経路（TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID）を使う。
   鍵が無ければサーバーログに残すだけで、通知できないことを理由に
   ログインを失敗させない。

   知らせるのは「入られた」と「締め出した」の二つだけ。毎回の失敗まで送ると
   通知が慣れになって、本当に危ないときに読まれなくなる。
   ------------------------------------------------------------------ */

export async function notifyStudio(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.info(`[studio] ${text}`);
    return;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) throw new Error(`telegram ${res.status}`);
  } catch (error) {
    console.error("[studio] 通知を送れませんでした", error);
  }
}
