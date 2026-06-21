// Best-effort outbound delivery for notifications. Never throws — callers treat
// a non-"sent" result as "not delivered" and keep going. Real delivery happens
// only when the relevant provider env vars are configured.
export type DeliveryResult = "sent" | "failed" | "skipped";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Sends an email via Resend if RESEND_API_KEY is set; otherwise skips. */
export async function deliverEmail(
  to: string | null,
  subject: string,
  body: string,
): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !to) return "skipped";

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? "CarPool <onboarding@resend.dev>",
        to,
        subject,
        text: body,
      }),
    });
    return res.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

/**
 * Sends a Telegram message via the bot if TELEGRAM_BOT_TOKEN is set and the user
 * has linked their chat (chatId captured when they /start the bot). Otherwise skips.
 */
export async function deliverTelegram(
  chatId: string | null,
  text: string,
): Promise<DeliveryResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return "skipped";

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    return res.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

/** Low-level Telegram send by chatId, used by the webhook to reply on linking. */
export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch {
    // best-effort reply
  }
}
