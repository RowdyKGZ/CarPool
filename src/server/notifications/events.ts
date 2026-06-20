import { NotificationType } from "@prisma/client";
import { db } from "@/lib/db";
import { ruContent } from "@/lib/content/ru";
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
