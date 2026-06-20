import { db } from "@/lib/db";

/** Recent notifications for the in-app feed. */
export function listNotifications(userId: string) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      readAt: true,
      createdAt: true,
    },
  });
}

/** Count of unread notifications, for the header badge. */
export function countUnreadNotifications(userId: string) {
  return db.notification.count({ where: { userId, readAt: null } });
}
