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

// NOTE: Telegram delivery needs a stored chat_id (the user must /start the bot
// first). Until that onboarding exists we record notifications via email/in-app
// only; wire deliverTelegram here once chat_id capture is added.
