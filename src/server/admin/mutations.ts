import {
  BookingStatus,
  ReportStatus,
  TripStatus,
  UserRole,
  UserStatus,
} from "@prisma/client";
import { db } from "@/lib/db";
import { ACTIVE_BOOKING_STATUSES } from "@/server/bookings/schema";
import { notifyTripCancelled } from "@/server/notifications/events";

export type AdminActionResult =
  | { ok: true }
  | { ok: false; reason: "NOT_FOUND" | "FORBIDDEN" };

/** Change a user's status (block/suspend/activate). Admins and self are protected. */
export async function setUserStatus(
  adminId: string,
  userId: string,
  status: UserStatus,
): Promise<AdminActionResult> {
  if (userId === adminId) return { ok: false, reason: "FORBIDDEN" };

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return { ok: false, reason: "NOT_FOUND" };
  if (user.role === UserRole.ADMIN) return { ok: false, reason: "FORBIDDEN" };

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { status } }),
    db.adminNote.create({
      data: { adminId, userId, note: `Статус изменён на ${status}.` },
    }),
  ]);

  return { ok: true };
}

/** Hide an invalid trip: cancel it, drop active bookings, notify passengers. */
export async function hideTrip(
  adminId: string,
  tripId: string,
): Promise<AdminActionResult> {
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    select: { status: true },
  });
  if (!trip) return { ok: false, reason: "NOT_FOUND" };

  const affected = await db.booking.findMany({
    where: { tripId, status: { in: ACTIVE_BOOKING_STATUSES } },
    select: { passengerId: true },
  });

  await db.$transaction([
    db.trip.update({
      where: { id: tripId },
      data: { status: TripStatus.CANCELLED },
    }),
    db.booking.updateMany({
      where: { tripId, status: { in: ACTIVE_BOOKING_STATUSES } },
      data: { status: BookingStatus.CANCELLED, cancelledAt: new Date() },
    }),
    db.adminNote.create({
      data: { adminId, tripId, note: "Поездка скрыта администратором." },
    }),
  ]);

  await notifyTripCancelled({
    tripId,
    passengerIds: affected.map((b) => b.passengerId),
  });

  return { ok: true };
}

/** Move a report through its lifecycle (reviewed/resolved/dismissed). */
export async function setReportStatus(
  adminId: string,
  reportId: string,
  status: ReportStatus,
): Promise<AdminActionResult> {
  const report = await db.report.findUnique({
    where: { id: reportId },
    select: { id: true },
  });
  if (!report) return { ok: false, reason: "NOT_FOUND" };

  await db.$transaction([
    db.report.update({ where: { id: reportId }, data: { status } }),
    db.adminNote.create({
      data: { adminId, reportId, note: `Жалоба переведена в ${status}.` },
    }),
  ]);

  return { ok: true };
}
