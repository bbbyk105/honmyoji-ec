"use server";

export type SubscribeState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "sent"; message: string };

export async function subscribeNote(_prev: SubscribeState, formData: FormData): Promise<SubscribeState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  const text = `MIROKU — Notes from the temple\n${email}`;
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
      console.info("[subscribe] (no TELEGRAM_* env — logging only)\n" + text);
    }
  } catch (err) {
    console.error("[subscribe] failed", err);
    return { status: "error", message: "We could not keep your address. Please try again." };
  }

  return {
    status: "sent",
    message: "Noted. We will write when a new piece is ready.",
  };
}
