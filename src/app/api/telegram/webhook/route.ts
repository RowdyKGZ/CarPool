import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/notify";
import { linkTelegramChat } from "@/server/telegram/mutations";

// Telegram delivers updates here. Configure with setWebhook (see README), passing
// a secret_token that Telegram echoes back in this header.
export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (
    secret &&
    request.headers.get("x-telegram-bot-api-secret-token") !== secret
  ) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: unknown;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const message = (update as { message?: { text?: string; chat?: { id?: number } } })
    .message;
  const text = message?.text?.trim();
  const chatId = message?.chat?.id;

  // Only handle the linking command: "/start <token>"
  if (text && chatId != null && text.startsWith("/start")) {
    const token = text.split(/\s+/)[1];
    if (token) {
      const result = await linkTelegramChat(token, chatId);
      await sendTelegramMessage(
        chatId,
        result.ok
          ? `Готово, ${result.userName}! Уведомления CarPool будут приходить сюда.`
          : "Ссылка недействительна или уже использована. Запроси новую в приложении.",
      );
    } else {
      await sendTelegramMessage(
        chatId,
        "Открой приложение CarPool и нажми «Подключить Telegram», чтобы привязать аккаунт.",
      );
    }
  }

  // Always 200 so Telegram doesn't retry.
  return NextResponse.json({ ok: true });
}
