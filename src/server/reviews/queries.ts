import { db } from "@/lib/db";

/** Targets the given author has already reviewed on a trip (to hide done forms). */
export function listAuthoredReviewsForTrip(tripId: string, authorId: string) {
  return db.review.findMany({
    where: { tripId, authorId },
    select: { targetUserId: true, rating: true },
  });
}
