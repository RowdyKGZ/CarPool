import { BookingStatus, NotificationType } from "@prisma/client";
import { db } from "@/lib/db";
import { ruContent } from "@/lib/content/ru";
import { formatDeparture } from "@/lib/datetime";
import { createNotification } from "./mutations";

const n = ruContent.notifications;

async function tripRoute(tripId: string): Promise<string> {
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    select: { pickupLabel: true, dropoffLabel: true },
  });
  return trip ? `${trip.pickupLabel} → ${trip.dropoffLabel}` : "";
}

async function userName(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  return user?.name ?? "";
}

/** Passenger requested a booking → notify the driver. */
export async function notifyBookingRequest(params: {
  tripId: string;
  driverId: string;
  passengerId: string;
  seats: number;
}): Promise<void> {
  try {
    const [route, passengerName] = await Promise.all([
      tripRoute(params.tripId),
      userName(params.passengerId),
    ]);
    const m = n.bookingRequest({ passengerName, route, seats: params.seats });
    await createNotification({
      userId: params.driverId,
      type: NotificationType.BOOKING_REQUEST,
      title: m.title,
      body: m.body,
      metadata: { tripId: params.tripId },
    });
  } catch {
    // never break the booking flow
  }
}

/** Driver confirmed or rejected a booking → notify the passenger. */
export async function notifyBookingDecision(params: {
  tripId: string;
  passengerId: string;
  confirmed: boolean;
}): Promise<void> {
  try {
    const route = await tripRoute(params.tripId);
    const m = params.confirmed
      ? n.bookingConfirmed({ route })
      : n.bookingRejected({ route });
    await createNotification({
      userId: params.passengerId,
      type: params.confirmed
        ? NotificationType.BOOKING_CONFIRMED
        : NotificationType.BOOKING_REJECTED,
      title: m.title,
      body: m.body,
      metadata: { tripId: params.tripId },
    });
  } catch {
    // never break the moderation flow
  }
}

/** Passenger cancelled their booking → notify the driver. */
export async function notifyBookingCancelled(params: {
  tripId: string;
  driverId: string;
  passengerId: string;
}): Promise<void> {
  try {
    const [route, passengerName] = await Promise.all([
      tripRoute(params.tripId),
      userName(params.passengerId),
    ]);
    const m = n.bookingCancelled({ passengerName, route });
    await createNotification({
      userId: params.driverId,
      type: NotificationType.BOOKING_CANCELLED,
      title: m.title,
      body: m.body,
      metadata: { tripId: params.tripId },
    });
  } catch {
    // never break the cancel flow
  }
}

/** Pre-departure reminder → notify the driver and confirmed passengers. */
export async function notifyTripReminder(params: {
  tripId: string;
}): Promise<void> {
  try {
    const trip = await db.trip.findUnique({
      where: { id: params.tripId },
      select: {
        driverId: true,
        pickupLabel: true,
        dropoffLabel: true,
        departureAt: true,
      },
    });
    if (!trip) return;

    const confirmed = await db.booking.findMany({
      where: { tripId: params.tripId, status: BookingStatus.CONFIRMED },
      select: { passengerId: true },
    });

    const route = `${trip.pickupLabel} → ${trip.dropoffLabel}`;
    const m = n.tripReminder({ route, time: formatDeparture(trip.departureAt) });
    const recipients = [
      trip.driverId,
      ...confirmed.map((b) => b.passengerId),
    ];

    await Promise.all(
      recipients.map((userId) =>
        createNotification({
          userId,
          type: NotificationType.TRIP_REMINDER,
          title: m.title,
          body: m.body,
          metadata: { tripId: params.tripId },
        }),
      ),
    );
  } catch {
    // never break the cron run
  }
}

/**
 * A trip just completed → nudge the driver and everyone who rode it to leave a
 * review. Skips trips nobody actually rode (no COMPLETED bookings).
 */
export async function notifyReviewRequest(params: {
  tripId: string;
}): Promise<void> {
  try {
    const trip = await db.trip.findUnique({
      where: { id: params.tripId },
      select: { driverId: true, pickupLabel: true, dropoffLabel: true },
    });
    if (!trip) return;

    const completed = await db.booking.findMany({
      where: { tripId: params.tripId, status: BookingStatus.COMPLETED },
      select: { passengerId: true },
    });
    if (completed.length === 0) return;

    const route = `${trip.pickupLabel} → ${trip.dropoffLabel}`;
    const driverMsg = n.reviewRequestDriver({ route });
    const passengerMsg = n.reviewRequestPassenger({ route });

    await Promise.all([
      createNotification({
        userId: trip.driverId,
        type: NotificationType.REVIEW_REQUEST,
        title: driverMsg.title,
        body: driverMsg.body,
        metadata: { tripId: params.tripId },
      }),
      ...completed.map((b) =>
        createNotification({
          userId: b.passengerId,
          type: NotificationType.REVIEW_REQUEST,
          title: passengerMsg.title,
          body: passengerMsg.body,
          metadata: { tripId: params.tripId },
        }),
      ),
    ]);
  } catch {
    // never break trip completion
  }
}

/** Driver edited a published trip's details → notify every affected passenger. */
export async function notifyTripUpdated(params: {
  tripId: string;
  passengerIds: string[];
}): Promise<void> {
  if (params.passengerIds.length === 0) return;
  try {
    const trip = await db.trip.findUnique({
      where: { id: params.tripId },
      select: { pickupLabel: true, dropoffLabel: true, departureAt: true },
    });
    if (!trip) return;

    const route = `${trip.pickupLabel} → ${trip.dropoffLabel}`;
    const m = n.tripUpdated({ route, time: formatDeparture(trip.departureAt) });
    await Promise.all(
      params.passengerIds.map((passengerId) =>
        createNotification({
          userId: passengerId,
          type: NotificationType.TRIP_UPDATED,
          title: m.title,
          body: m.body,
          metadata: { tripId: params.tripId },
        }),
      ),
    );
  } catch {
    // never break the edit flow
  }
}

/** Driver cancelled the trip → notify every affected passenger. */
export async function notifyTripCancelled(params: {
  tripId: string;
  passengerIds: string[];
}): Promise<void> {
  if (params.passengerIds.length === 0) return;
  try {
    const route = await tripRoute(params.tripId);
    const m = n.tripCancelled({ route });
    await Promise.all(
      params.passengerIds.map((passengerId) =>
        createNotification({
          userId: passengerId,
          type: NotificationType.TRIP_CANCELLED,
          title: m.title,
          body: m.body,
          metadata: { tripId: params.tripId },
        }),
      ),
    );
  } catch {
    // never break the cancel flow
  }
}
