import { db } from "@/lib/db";

export type CreateReportResult =
  | { ok: true }
  | { ok: false; reason: "NOT_FOUND" | "OWN_TRIP" };

/** A passenger/viewer reports a trip; target is the trip's driver. */
export async function createReport(
  reporterId: string,
  input: { tripId: string; reason: string },
): Promise<CreateReportResult> {
  const trip = await db.trip.findUnique({
    where: { id: input.tripId },
    select: { driverId: true },
  });
  if (!trip) return { ok: false, reason: "NOT_FOUND" };
  if (trip.driverId === reporterId) return { ok: false, reason: "OWN_TRIP" };

  await db.report.create({
    data: {
      reporterId,
      tripId: input.tripId,
      targetUserId: trip.driverId,
      reason: input.reason,
    },
  });

  return { ok: true };
}
