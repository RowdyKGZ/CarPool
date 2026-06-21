import { randomUUID } from "crypto";
import { db } from "@/lib/db";

/** Generates (and stores) a fresh one-time token used in the bot deep link. */
export async function createTelegramLinkToken(userId: string): Promise<string> {
  const token = randomUUID().replace(/-/g, "");
  await db.user.update({
    where: { id: userId },
    data: { telegramLinkToken: token },
  });
  return token;
}

export type LinkTelegramResult =
  | { ok: true; userName: string }
  | { ok: false };

/**
 * Binds a Telegram chat to the user that owns `token` (set when they /start the
 * bot). Consumes the token so a link can't be reused.
 */
export async function linkTelegramChat(
  token: string,
  chatId: number | string,
): Promise<LinkTelegramResult> {
  const user = await db.user.findUnique({
    where: { telegramLinkToken: token },
    select: { id: true, name: true },
  });
  if (!user) return { ok: false };

  await db.user.update({
    where: { id: user.id },
    data: {
      telegramChatId: String(chatId),
      telegramLinkToken: null,
    },
  });

  return { ok: true, userName: user.name };
}
