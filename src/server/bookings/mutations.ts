import { BookingStatus, TripStatus } from "@prisma/client";
import { db } from "@/lib/db";
import {
  notifyBookingCancelled,
  notifyBookingDecision,
  notifyBookingRequest,
} from "@/server/notifications/events";
import { ACTIVE_BOOKING_STATUSES, type BookingCreateInput } from "./schema";

export type CreateBookingResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "TRIP_UNAVAILABLE"
        | "TRIP_DEPARTED"
        | "OWN_TRIP"
        | "NOT_ENOUGH_SEATS"
        | "ALREADY_BOOKED"
        | "UNKNOWN";
    };

export type ModerateBookingResult =
  | { ok: true; tripId: string }
  | {
      ok: false;
      reason: "NOT_FOUND" | "FORBIDDEN" | "ALREADY_HANDLED" | "INVALID_STATE";
    };

export type CancelBookingResult =
  | { ok: true; tripId: string }
  | { ok: false; reason: "NOT_FOUND" | "FORBIDDEN" | "NOT_ACTIVE" };

/**
 * Creates a passenger booking and decrements available seats atomically.
 * Rejects bookings on unavailable trips, own trips, oversold seats, or duplicates.
 */
export async function createBooking(
  passengerId: string,
  input: BookingCreateInput,
): Promise<CreateBookingResult> {
  const { tripId, seatsRequested, note } = input;
  let driverId = "";
  try {
    await db.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({
        where: { id: tripId },
        select: {
          status: true,
          availableSeats: true,
          driverId: true,
          departureAt: true,
        },
      });

      if (!trip || trip.status !== TripStatus.PUBLISHED) {
        throw new Error("TRIP_UNAVAILABLE");
      }
      if (trip.departureAt <= new Date()) {
        throw new Error("TRIP_DEPARTED");
      }
      if (trip.driverId === passengerId) {
        throw new Error("OWN_TRIP");
      }
      driverId = trip.driverId;
      if (trip.availableSeats < seatsRequested) {
        throw new Error("NOT_ENOUGH_SEATS");
      }

      const existing = await tx.booking.findFirst({
        where: { tripId, passengerId, status: { in: ACTIVE_BOOKING_STATUSES } },
      });
      if (existing) {
        throw new Error("ALREADY_BOOKED");
      }

      await tx.booking.create({
        data: { tripId, passengerId, seatsRequested, note },
      });
      await tx.trip.update({
        where: { id: tripId },
        data: { availableSeats: { decrement: seatsRequested } },
      });
    });
  } catch (e) {
    const reason = e instanceof Error ? e.message : "";
    switch (reason) {
      case "TRIP_UNAVAILABLE":
      case "TRIP_DEPARTED":
      case "OWN_TRIP":
      case "NOT_ENOUGH_SEATS":
      case "ALREADY_BOOKED":
        return { ok: false, reason };
      default:
        return { ok: false, reason: "UNKNOWN" };
    }
  }

  await notifyBookingRequest({ tripId, driverId, passengerId, seats: seatsRequested });
  return { ok: true };
}

/** Driver confirms a pending booking. Verifies ownership and pending state. */
export async function confirmBooking(
  driverId: string,
  bookingId: string,
): Promise<ModerateBookingResult> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      status: true,
      passengerId: true,
      trip: { select: { id: true, driverId: true } },
    },
  });

  if (!booking) return { ok: false, reason: "NOT_FOUND" };
  if (booking.trip.driverId !== driverId) return { ok: false, reason: "FORBIDDEN" };
  if (booking.status !== BookingStatus.PENDING) {
    return { ok: false, reason: "ALREADY_HANDLED" };
  }

  await db.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.CONFIRMED, confirmedAt: new Date() },
  });

  await notifyBookingDecision({
    tripId: booking.trip.id,
    passengerId: booking.passengerId,
    confirmed: true,
  });

  return { ok: true, tripId: booking.trip.id };
}

/**
 * Driver flips a finished booking between COMPLETED and NO_SHOW. Only valid on a
 * completed trip's bookings; seats are untouched (the trip is over). Used by both
 * `markBookingNoShow` and its undo `markBookingAttended`.
 */
async function setBookingAttendance(
  driverId: string,
  bookingId: string,
  from: BookingStatus,
  to: BookingStatus,
): Promise<ModerateBookingResult> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: { status: true, trip: { select: { id: true, driverId: true } } },
  });

  if (!booking) return { ok: false, reason: "NOT_FOUND" };
  if (booking.trip.driverId !== driverId) return { ok: false, reason: "FORBIDDEN" };
  if (booking.status !== from) return { ok: false, reason: "INVALID_STATE" };

  await db.booking.update({ where: { id: bookingId }, data: { status: to } });
  return { ok: true, tripId: booking.trip.id };
}

/** Driver marks a passenger who didn't show up (COMPLETED → NO_SHOW). */
export function markBookingNoShow(driverId: string, bookingId: string) {
  return setBookingAttendance(
    driverId,
    bookingId,
    BookingStatus.COMPLETED,
    BookingStatus.NO_SHOW,
  );
}

/** Driver reverts a no-show mark (NO_SHOW → COMPLETED). */
export function markBookingAttended(driverId: string, bookingId: string) {
  return setBookingAttendance(
    driverId,
    bookingId,
    BookingStatus.NO_SHOW,
    BookingStatus.COMPLETED,
  );
}

/** Passenger cancels their own active booking and returns its seats to the trip. */
export async function cancelBooking(
  passengerId: string,
  bookingId: string,
): Promise<CancelBookingResult> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      status: true,
      seatsRequested: true,
      passengerId: true,
      trip: { select: { id: true, driverId: true } },
    },
  });

  if (!booking) return { ok: false, reason: "NOT_FOUND" };
  if (booking.passengerId !== passengerId) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  if (!ACTIVE_BOOKING_STATUSES.includes(booking.status)) {
    return { ok: false, reason: "NOT_ACTIVE" };
  }

  await db.$transaction([
    db.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED, cancelledAt: new Date() },
    }),
    db.trip.update({
      where: { id: booking.trip.id },
      data: { availableSeats: { increment: booking.seatsRequested } },
    }),
  ]);

  await notifyBookingCancelled({
    tripId: booking.trip.id,
    driverId: booking.trip.driverId,
    passengerId,
  });

  return { ok: true, tripId: booking.trip.id };
}

/** Driver rejects a pending booking and returns its seats to the trip. */
export async function rejectBooking(
  driverId: string,
  bookingId: string,
): Promise<ModerateBookingResult> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      status: true,
      seatsRequested: true,
      passengerId: true,
      trip: { select: { id: true, driverId: true } },
    },
  });

  if (!booking) return { ok: false, reason: "NOT_FOUND" };
  if (booking.trip.driverId !== driverId) return { ok: false, reason: "FORBIDDEN" };
  if (booking.status !== BookingStatus.PENDING) {
    return { ok: false, reason: "ALREADY_HANDLED" };
  }

  await db.$transaction([
    db.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.REJECTED },
    }),
    db.trip.update({
      where: { id: booking.trip.id },
      data: { availableSeats: { increment: booking.seatsRequested } },
    }),
  ]);

  await notifyBookingDecision({
    tripId: booking.trip.id,
    passengerId: booking.passengerId,
    confirmed: false,
  });

  return { ok: true, tripId: booking.trip.id };
}
