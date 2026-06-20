"use server";

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { markAllNotificationsRead } from "@/server/notifications/mutations";

export async function markNotificationsReadAction() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/notifications");
  }

  await markAllNotificationsRead(session.user.id);
  redirect("/notifications");
}
