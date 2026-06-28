"use server";

import { headers } from "next/headers";
import { startTelegramLogin } from "@/server/telegram/otp";

/** Starts a Telegram OTP login: creates a challenge and returns the bot deep link
 * the client opens. `ok: false` carries why (bot not configured, or rate-limited). */
export async function startTelegramLoginAction(): Promise<
  | { ok: true; nonce: string; deepLink: string }
  | { ok: false; reason: "unavailable" | "rate_limited" }
> {
  const hdrs = await headers();
  const requestIp =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    null;

  return startTelegramLogin(requestIp);
}
