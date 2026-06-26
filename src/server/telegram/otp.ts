import { randomInt, randomUUID } from "crypto";
import { UserStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizeTelegramUsername } from "@/server/users/profile";

/** Deep-link payloads for the OTP login flow are prefixed so the webhook can tell
 * them apart from the existing notification-linking tokens (`/start <linkToken>`). */
export const TELEGRAM_LOGIN_PREFIX = "tg_";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;

export type StartTelegramLoginResult = { nonce: string; deepLink: string };

/** Creates a fresh challenge and returns the deep link the user opens in Telegram.
 * Returns null if the bot username isn't configured (feature unavailable). */
export async function startTelegramLogin(): Promise<StartTelegramLoginResult | null> {
  const botUsername = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "");
  if (!botUsername) return null;

  const nonce = randomUUID().replace(/-/g, "");
  await db.telegramAuthChallenge.create({
    data: { nonce, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });

  return {
    nonce,
    deepLink: `https://t.me/${botUsername}?start=${TELEGRAM_LOGIN_PREFIX}${nonce}`,
  };
}

export type TelegramSender = {
  id: number | string;
  username?: string | null;
  first_name?: string | null;
};

/**
 * Webhook side: the user opened the deep link, so we know their Telegram identity.
 * Generate + store a 6-digit code and return it for the bot to send. Returns null
 * when the nonce is unknown, expired or already consumed.
 */
export async function deliverTelegramOtp(
  nonce: string,
  sender: TelegramSender,
  chatId: number | string,
): Promise<string | null> {
  const challenge = await db.telegramAuthChallenge.findUnique({ where: { nonce } });
  if (!challenge || challenge.consumedAt || challenge.expiresAt < new Date()) {
    return null;
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.telegramAuthChallenge.update({
    where: { nonce },
    data: {
      code,
      telegramUserId: String(sender.id),
      telegramChatId: String(chatId),
      username: sender.username ?? null,
      firstName: sender.first_name ?? null,
      attempts: 0,
    },
  });
  return code;
}

export type VerifiedTelegramUser = {
  id: string;
  email: string | null;
  name: string;
};

export type VerifyTelegramOtpResult =
  | { ok: true; user: VerifiedTelegramUser }
  | { ok: false; reason: "invalid" | "expired" | "not_sent" | "too_many" | "blocked" };

/**
 * Verify the code the user typed and resolve them to a User row, creating one on
 * first sign-in (keyed by the stable Telegram user id). Consumes the challenge so
 * a code can't be replayed.
 */
export async function verifyTelegramOtp(
  nonce: string,
  code: string,
): Promise<VerifyTelegramOtpResult> {
  const challenge = await db.telegramAuthChallenge.findUnique({ where: { nonce } });
  if (!challenge || challenge.consumedAt) return { ok: false, reason: "invalid" };
  if (challenge.expiresAt < new Date()) return { ok: false, reason: "expired" };
  if (!challenge.code || !challenge.telegramUserId) return { ok: false, reason: "not_sent" };
  if (challenge.attempts >= MAX_OTP_ATTEMPTS) return { ok: false, reason: "too_many" };

  if (challenge.code !== code.trim()) {
    await db.telegramAuthChallenge.update({
      where: { nonce },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: "invalid" };
  }

  // Correct code: burn the challenge first so it can't be reused, then upsert user.
  await db.telegramAuthChallenge.update({
    where: { nonce },
    data: { consumedAt: new Date() },
  });

  const telegramUserId = challenge.telegramUserId;
  const username = challenge.username
    ? normalizeTelegramUsername(challenge.username)
    : null;

  const existing = await db.user.findUnique({ where: { telegramUserId } });

  if (existing) {
    if (existing.status !== UserStatus.ACTIVE) return { ok: false, reason: "blocked" };
    const user = await db.user.update({
      where: { id: existing.id },
      data: { telegramChatId: challenge.telegramChatId },
    });
    return { ok: true, user: { id: user.id, email: user.email, name: user.name } };
  }

  // telegramUsername is intentionally left for the onboarding step (it's a unique
  // field the user confirms there), so first-time creation can't hit a conflict.
  const name = challenge.firstName?.trim() || (username ? `@${username}` : "Пользователь Telegram");
  const created = await db.user.create({
    data: {
      name,
      telegramUserId,
      telegramChatId: challenge.telegramChatId,
      isVerified: true,
    },
  });
  return { ok: true, user: { id: created.id, email: created.email, name: created.name } };
}
