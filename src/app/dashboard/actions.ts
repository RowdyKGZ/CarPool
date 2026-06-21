"use server";

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { createTelegramLinkToken } from "@/server/telegram/mutations";

export async function connectTelegramAction() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/dashboard");
  }

  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  if (!botUsername) {
    redirect("/dashboard");
  }

  const token = await createTelegramLinkToken(session.user.id);
  redirect(`https://t.me/${botUsername}?start=${token}`);
}
