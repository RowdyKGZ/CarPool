import { BookingStatus, Prisma, TripStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { ReviewCreateInput } from "./schema";

export type CreateReviewResult =
  | { ok: true; tripId: string }
  | {
      ok: false;
      reason:
        | "NOT_FOUND"
        | "TRIP_NOT_COMPLETED"
        | "SELF"
        | "NOT_PARTICIPANT"
        | "ALREADY_REVIEWED"
        | "UNKNOWN";
    };

/** Whether `passengerId` actually rode this trip (has a COMPLETED booking). */
function hasCompletedRide(tripId: string, passengerId: string) {
  return db.booking
    .findFirst({
      where: { tripId, passengerId, status: BookingStatus.COMPLETED },
      select: { id: true },
    })
    .then(Boolean);
}

/**
 * Creates a mutual review on a COMPLETED trip. Only the driver may review
 * passengers who rode, and only those passengers may review the driver.
 * Recomputes the target's driver rating when they have a driver profile.
 */
export async function createReview(
  authorId: string,
  input: ReviewCreateInput,
): Promise<CreateReviewResult> {
  const { tripId, targetUserId, rating, comment } = input;
  if (authorId === targetUserId) return { ok: false, reason: "SELF" };

  const trip = await db.trip.findUnique({
    where: { id: tripId },
    select: { status: true, driverId: true },
  });
  if (!trip) return { ok: false, reason: "NOT_FOUND" };
  if (trip.status !== TripStatus.COMPLETED) {
    return { ok: false, reason: "TRIP_NOT_COMPLETED" };
  }

  const authorIsDriver = trip.driverId === authorId;
  const targetIsDriver = trip.driverId === targetUserId;

  let valid = false;
  if (authorIsDriver && !targetIsDriver) {
    valid = await hasCompletedRide(tripId, targetUserId);
  } else if (targetIsDriver && !authorIsDriver) {
    valid = await hasCompletedRide(tripId, authorId);
  }
  if (!valid) return { ok: false, reason: "NOT_PARTICIPANT" };

  try {
    await db.review.create({
      data: { tripId, authorId, targetUserId, rating, comment },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { ok: false, reason: "ALREADY_REVIEWED" };
    }
    return { ok: false, reason: "UNKNOWN" };
  }

  // Keep the target's public driver rating in sync (no-op if not a driver).
  const agg = await db.review.aggregate({
    where: { targetUserId },
    _avg: { rating: true },
  });
  await db.driverProfile.updateMany({
    where: { userId: targetUserId },
    data: { averageRating: agg._avg.rating ?? 0 },
  });

  return { ok: true, tripId };
}
