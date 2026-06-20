import { db } from "@/lib/db";
import { ACTIVE_BOOKING_STATUSES } from "./schema";

/** All bookings made by a passenger, newest first (for /my-bookings). */
export function listPassengerBookings(passengerId: string) {
  return db.booking.findMany({
    where: { passengerId },
    select: {
      id: true,
      status: true,
      seatsRequested: true,
      note: true,
      createdAt: true,
      trip: {
        select: {
          id: true,
          pickupLabel: true,
          dropoffLabel: true,
          departureAt: true,
          pricePerSeat: true,
          driver: {
            select: { name: true, phone: true, telegramUsername: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** All bookings on a trip, for the driver's moderation view. */
export function listTripBookings(tripId: string) {
  return db.booking.findMany({
    where: { tripId },
    select: {
      id: true,
      status: true,
      seatsRequested: true,
      note: true,
      passenger: {
        select: { name: true, phone: true, telegramUsername: true },
      },
    },
    orderBy: [{ createdAt: "asc" }],
  });
}

/** The passenger's current active booking on a trip, if any. */
export function getActiveBookingForTrip(tripId: string, passengerId: string) {
  return db.booking.findFirst({
    where: {
      tripId,
      passengerId,
      status: { in: ACTIVE_BOOKING_STATUSES },
    },
    select: { status: true, seatsRequested: true },
  });
}
