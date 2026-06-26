"use server";

import { startTelegramLogin } from "@/server/telegram/otp";

/** Starts a Telegram OTP login: creates a challenge and returns the bot deep link
 * the client opens. Returns { ok: false } if the bot isn't configured. */
export async function startTelegramLoginAction(): Promise<
  { ok: true; nonce: string; deepLink: string } | { ok: false }
> {
  const result = await startTelegramLogin();
  if (!result) return { ok: false };
  return { ok: true, nonce: result.nonce, deepLink: result.deepLink };
}
