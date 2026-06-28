import { randomInt, randomUUID } from "crypto";
import { UserStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizeTelegramUsername } from "@/server/users/profile";

/** Deep-link payloads for the OTP login flow are prefixed so the webhook can tell
 * them apart from the existing notification-linking tokens (`/start <linkToken>`). */
export const TELEGRAM_LOGIN_PREFIX = "tg_";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;
// A single Telegram account may request at most this many codes per window.
const OTP_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_OTP_DELIVERIES = 5;
// One source IP may start at most this many login challenges per window.
const START_RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_STARTS_PER_IP = 5;

/** True if no other user already claims this (globally unique) Telegram username. */
async function isTelegramUsernameFree(username: string): Promise<boolean> {
  const taken = await db.user.findUnique({
    where: { telegramUsername: username },
    select: { id: true },
  });
  return !taken;
}

export type StartTelegramLoginResult =
  | { ok: true; nonce: string; deepLink: string }
  | { ok: false; reason: "unavailable" | "rate_limited" };

/** Creates a fresh challenge and returns the deep link the user opens in Telegram.
 * `requestIp` (when known) is used to throttle how many challenges one source can
 * start. Returns `unavailable` if the bot isn't configured. */
export async function startTelegramLogin(
  requestIp?: string | null,
): Promise<StartTelegramLoginResult> {
  const botUsername = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "");
  if (!botUsername) return { ok: false, reason: "unavailable" };

  // Opportunistic cleanup: drop expired and already-consumed challenges so the
  // table doesn't accumulate dead rows (no separate cron needed).
  await db.telegramAuthChallenge.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { consumedAt: { not: null } }],
    },
  });

  if (requestIp) {
    const recentStarts = await db.telegramAuthChallenge.count({
      where: {
        requestIp,
        createdAt: { gte: new Date(Date.now() - START_RATE_WINDOW_MS) },
      },
    });
    if (recentStarts >= MAX_STARTS_PER_IP) {
      return { ok: false, reason: "rate_limited" };
    }
  }

  const nonce = randomUUID().replace(/-/g, "");
  await db.telegramAuthChallenge.create({
    data: {
      nonce,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      requestIp: requestIp ?? null,
    },
  });

  return {
    ok: true,
    nonce,
    deepLink: `https://t.me/${botUsername}?start=${TELEGRAM_LOGIN_PREFIX}${nonce}`,
  };
}

export type TelegramSender = {
  id: number | string;
  username?: string | null;
  first_name?: string | null;
};

export type DeliverTelegramOtpResult =
  | { ok: true; code: string }
  | { ok: false; reason: "invalid" | "rate_limited" };

/**
 * Webhook side: the user opened the deep link, so we know their Telegram identity.
 * Generate + store a 6-digit code and return it for the bot to send. Returns an
 * error when the nonce is unknown/expired/consumed, or when this Telegram account
 * has requested too many codes recently.
 */
export async function deliverTelegramOtp(
  nonce: string,
  sender: TelegramSender,
  chatId: number | string,
): Promise<DeliverTelegramOtpResult> {
  const challenge = await db.telegramAuthChallenge.findUnique({ where: { nonce } });
  if (!challenge || challenge.consumedAt || challenge.expiresAt < new Date()) {
    return { ok: false, reason: "invalid" };
  }

  // Throttle code requests per Telegram account so the bot can't be used to spam.
  const recentDeliveries = await db.telegramAuthChallenge.count({
    where: {
      telegramUserId: String(sender.id),
      code: { not: null },
      createdAt: { gte: new Date(Date.now() - OTP_RATE_WINDOW_MS) },
    },
  });
  if (recentDeliveries >= MAX_OTP_DELIVERIES) {
    return { ok: false, reason: "rate_limited" };
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
  return { ok: true, code };
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
    // Backfill telegramUsername from Telegram if we don't have it yet (and it's
    // free) — one less thing the user has to type on the onboarding step.
    const backfillUsername =
      !existing.telegramUsername && username && (await isTelegramUsernameFree(username))
        ? username
        : undefined;
    const user = await db.user.update({
      where: { id: existing.id },
      data: {
        telegramChatId: challenge.telegramChatId,
        ...(backfillUsername ? { telegramUsername: backfillUsername } : {}),
      },
    });
    return { ok: true, user: { id: user.id, email: user.email, name: user.name } };
  }

  // Prefill telegramUsername from Telegram so the user doesn't re-enter it; only
  // when free, so first-time creation can't hit the unique constraint.
  const telegramUsername =
    username && (await isTelegramUsernameFree(username)) ? username : null;
  const name = challenge.firstName?.trim() || (username ? `@${username}` : "Пользователь Telegram");
  const created = await db.user.create({
    data: {
      name,
      telegramUserId,
      telegramUsername,
      telegramChatId: challenge.telegramChatId,
      isVerified: true,
    },
  });
  return { ok: true, user: { id: created.id, email: created.email, name: created.name } };
}
