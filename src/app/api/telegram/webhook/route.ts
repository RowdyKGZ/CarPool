import { NextResponse } from "next/server";
import { ruContent } from "@/lib/content/ru";
import { sendTelegramMessage } from "@/lib/notify";
import { linkTelegramChat } from "@/server/telegram/mutations";
import { TELEGRAM_LOGIN_PREFIX, deliverTelegramOtp } from "@/server/telegram/otp";

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

  const message = (
    update as {
      message?: {
        text?: string;
        chat?: { id?: number };
        from?: { id?: number; username?: string; first_name?: string };
      };
    }
  ).message;
  const text = message?.text?.trim();
  const chatId = message?.chat?.id;
  const from = message?.from;

  // Handle the "/start <param>" command. The param is either a login nonce
  // (prefixed, OTP sign-in flow) or a notification-linking token.
  if (text && chatId != null && text.startsWith("/start")) {
    const param = text.split(/\s+/)[1];

    if (param?.startsWith(TELEGRAM_LOGIN_PREFIX) && from?.id != null) {
      const nonce = param.slice(TELEGRAM_LOGIN_PREFIX.length);
      const code = await deliverTelegramOtp(
        nonce,
        { id: from.id, username: from.username, first_name: from.first_name },
        chatId,
      );
      await sendTelegramMessage(
        chatId,
        code
          ? ruContent.telegramBot.loginCode(code)
          : ruContent.telegramBot.loginInvalid,
      );
    } else if (param) {
      const result = await linkTelegramChat(param, chatId);
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
