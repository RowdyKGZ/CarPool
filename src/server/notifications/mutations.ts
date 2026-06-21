import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  type Prisma,
} from "@prisma/client";
import { db } from "@/lib/db";
import { deliverEmail, deliverTelegram } from "@/lib/notify";

/**
 * Persists a notification and attempts best-effort email delivery.
 * Never throws — notifications must not break the action that triggered them.
 */
export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    const user = await db.user.findUnique({
      where: { id: input.userId },
      select: { email: true, telegramChatId: true },
    });

    // Prefer Telegram when the user has linked the bot; otherwise email.
    const useTelegram = Boolean(user?.telegramChatId);
    const channel = useTelegram
      ? NotificationChannel.TELEGRAM
      : NotificationChannel.EMAIL;

    const notification = await db.notification.create({
      data: {
        userId: input.userId,
        channel,
        type: input.type,
        title: input.title,
        body: input.body,
        metadata: input.metadata,
      },
    });

    const message = `${input.title}\n\n${input.body}`;
    const result = useTelegram
      ? await deliverTelegram(user?.telegramChatId ?? null, message)
      : await deliverEmail(user?.email ?? null, input.title, input.body);

    if (result !== "skipped") {
      await db.notification.update({
        where: { id: notification.id },
        data:
          result === "sent"
            ? { status: NotificationStatus.SENT, sentAt: new Date() }
            : { status: NotificationStatus.FAILED },
      });
    }
  } catch {
    // swallow — the triggering action already succeeded
  }
}

/** Marks all of a user's unread notifications as read. */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  await db.notification.updateMany({
    where: { userId, readAt: null },
    data: { status: NotificationStatus.READ, readAt: new Date() },
  });
}
