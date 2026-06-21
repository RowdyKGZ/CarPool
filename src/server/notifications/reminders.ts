import { TripStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { notifyTripReminder } from "./events";

// How far ahead of departure to send the reminder. Should be >= the cron interval
// so trips aren't skipped between runs.
const REMINDER_WINDOW_MIN = Number(process.env.REMINDER_WINDOW_MIN ?? 90);

/**
 * Finds published trips departing within the reminder window that haven't been
 * reminded yet, notifies participants, and marks them. Returns how many were sent.
 */
export async function sendDueTripReminders(): Promise<number> {
  const now = new Date();
  const until = new Date(now.getTime() + REMINDER_WINDOW_MIN * 60_000);

  const trips = await db.trip.findMany({
    where: {
      status: TripStatus.PUBLISHED,
      reminderSentAt: null,
      departureAt: { gt: now, lte: until },
    },
    select: { id: true },
  });

  for (const trip of trips) {
    // Claim first so an overlapping run won't double-send.
    const claimed = await db.trip.updateMany({
      where: { id: trip.id, reminderSentAt: null },
      data: { reminderSentAt: new Date() },
    });
    if (claimed.count === 0) continue;

    await notifyTripReminder({ tripId: trip.id });
  }

  return trips.length;
}
