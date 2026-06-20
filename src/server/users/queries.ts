import { db } from "@/lib/db";

/**
 * Loads the profile/vehicle context needed to gate trip publishing for a user
 * (profile completeness + driver setup completeness + primary vehicle).
 */
export function getTripPublishContext(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      phone: true,
      telegramUsername: true,
      driverProfile: { select: { id: true } },
      vehicles: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: {
          id: true,
          make: true,
          model: true,
          color: true,
          plateNumber: true,
          seatsCount: true,
        },
      },
    },
  });
}
