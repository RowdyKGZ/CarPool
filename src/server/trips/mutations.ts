import { BookingStatus, Prisma, TripStatus } from "@prisma/client";
import { db } from "@/lib/db";
import {
  formatBishkekTime,
  nextBishkekOccurrenceLocal,
  parseBishkekDatetime,
} from "@/lib/datetime";
import { ACTIVE_BOOKING_STATUSES } from "@/server/bookings/schema";
import { notifyTripCancelled } from "@/server/notifications/events";
import type { TripCreateInput } from "./schema";

export type TripActionResult =
  | { ok: true }
  | { ok: false; reason: "NOT_FOUND" | "FORBIDDEN" | "NOT_PUBLISHED" };

async function loadOwnedPublishedTrip(
  driverId: string,
  tripId: string,
): Promise<TripActionResult> {
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    select: { status: true, driverId: true },
  });

  if (!trip) return { ok: false, reason: "NOT_FOUND" };
  if (trip.driverId !== driverId) return { ok: false, reason: "FORBIDDEN" };
  if (trip.status !== TripStatus.PUBLISHED) {
    return { ok: false, reason: "NOT_PUBLISHED" };
  }
  return { ok: true };
}

/** Persists a new published trip. Seats start fully available. */
export function createTrip(args: {
  driverId: string;
  vehicleId: string;
  departureAt: Date;
  data: TripCreateInput;
}) {
  const { driverId, vehicleId, departureAt, data } = args;
  return db.trip.create({
    data: {
      driverId,
      vehicleId,
      pickupLabel: data.pickupLabel,
      pickupLat: data.pickupLat ?? null,
      pickupLng: data.pickupLng ?? null,
      dropoffLabel: data.dropoffLabel,
      dropoffLat: data.dropoffLat ?? null,
      dropoffLng: data.dropoffLng ?? null,
      departureAt,
      pricePerSeat: data.pricePerSeat,
      totalSeats: data.totalSeats,
      availableSeats: data.totalSeats,
      comment: data.comment,
    },
  });
}

/**
 * Lazily completes published trips whose departure has passed (same cascade as
 * `completeTrip`): confirmed bookings → COMPLETED (unlocking reviews), leftover
 * pending → CANCELLED, driver's tripsCompleted incremented. Called on read paths
 * (trip detail / my-trips / my-bookings) since there's no scheduler. Returns the
 * number of trips completed.
 */
export async function autoCompleteDepartedTrips(
  scope: Prisma.TripWhereInput,
): Promise<number> {
  const now = new Date();
  const departed = await db.trip.findMany({
    where: { ...scope, status: TripStatus.PUBLISHED, departureAt: { lt: now } },
    select: { id: true, driverId: true },
  });

  for (const trip of departed) {
    await db.$transaction([
      db.trip.update({
        where: { id: trip.id },
        data: { status: TripStatus.COMPLETED },
      }),
      db.booking.updateMany({
        where: { tripId: trip.id, status: BookingStatus.CONFIRMED },
        data: { status: BookingStatus.COMPLETED },
      }),
      db.booking.updateMany({
        where: { tripId: trip.id, status: BookingStatus.PENDING },
        data: { status: BookingStatus.CANCELLED, cancelledAt: now },
      }),
      db.driverProfile.updateMany({
        where: { userId: trip.driverId },
        data: { tripsCompleted: { increment: 1 } },
      }),
    ]);
  }

  return departed.length;
}

export type RepeatTripResult =
  | { ok: true; id: string }
  | { ok: false; reason: "NOT_FOUND" };

/**
 * Clones one of the driver's trips into a fresh published trip for the next
 * occurrence of the original's time of day. Seats start fully available.
 */
export async function repeatTrip(
  driverId: string,
  tripId: string,
): Promise<RepeatTripResult> {
  const trip = await db.trip.findFirst({
    where: { id: tripId, driverId },
    include: { vehicle: { select: { seatsCount: true } } },
  });
  if (!trip) return { ok: false, reason: "NOT_FOUND" };

  const departureAt =
    parseBishkekDatetime(
      nextBishkekOccurrenceLocal(formatBishkekTime(trip.departureAt)),
    ) ?? new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Idempotent: if an identical published trip already exists for that slot (e.g.
  // "Повторить" tapped twice), return it instead of creating a duplicate.
  const duplicate = await db.trip.findFirst({
    where: {
      driverId,
      status: TripStatus.PUBLISHED,
      pickupLabel: trip.pickupLabel,
      dropoffLabel: trip.dropoffLabel,
      departureAt,
    },
    select: { id: true },
  });
  if (duplicate) return { ok: true, id: duplicate.id };

  // Clamp seats to the current vehicle capacity (it may have changed since).
  const totalSeats = Math.min(trip.totalSeats, trip.vehicle.seatsCount);

  const created = await db.trip.create({
    data: {
      driverId: trip.driverId,
      vehicleId: trip.vehicleId,
      pickupLabel: trip.pickupLabel,
      pickupLat: trip.pickupLat,
      pickupLng: trip.pickupLng,
      dropoffLabel: trip.dropoffLabel,
      dropoffLat: trip.dropoffLat,
      dropoffLng: trip.dropoffLng,
      departureAt,
      pricePerSeat: trip.pricePerSeat,
      totalSeats,
      availableSeats: totalSeats,
      comment: trip.comment,
    },
    select: { id: true },
  });

  return { ok: true, id: created.id };
}

export type UpdateTripResult =
  | { ok: true }
  | {
      ok: false;
      reason: "NOT_FOUND" | "FORBIDDEN" | "NOT_PUBLISHED" | "SEATS_BELOW_BOOKED";
    };

/**
 * Driver edits a published trip. Recomputes availableSeats from active bookings so
 * the counter stays consistent, and refuses to drop totalSeats below seats already
 * booked.
 */
export async function updateTrip(args: {
  driverId: string;
  tripId: string;
  departureAt: Date;
  data: TripCreateInput;
}): Promise<UpdateTripResult> {
  const { driverId, tripId, departureAt, data } = args;

  const guard = await loadOwnedPublishedTrip(driverId, tripId);
  if (!guard.ok) {
    return { ok: false, reason: guard.reason };
  }

  const active = await db.booking.aggregate({
    where: { tripId, status: { in: ACTIVE_BOOKING_STATUSES } },
    _sum: { seatsRequested: true },
  });
  const bookedSeats = active._sum.seatsRequested ?? 0;

  if (data.totalSeats < bookedSeats) {
    return { ok: false, reason: "SEATS_BELOW_BOOKED" };
  }

  await db.trip.update({
    where: { id: tripId },
    data: {
      pickupLabel: data.pickupLabel,
      pickupLat: data.pickupLat ?? null,
      pickupLng: data.pickupLng ?? null,
      dropoffLabel: data.dropoffLabel,
      dropoffLat: data.dropoffLat ?? null,
      dropoffLng: data.dropoffLng ?? null,
      departureAt,
      pricePerSeat: data.pricePerSeat,
      totalSeats: data.totalSeats,
      availableSeats: data.totalSeats - bookedSeats,
      comment: data.comment,
    },
  });

  return { ok: true };
}

/**
 * Driver cancels a published trip. Cascades all active (pending/confirmed)
 * bookings to CANCELLED.
 */
export async function cancelTrip(
  driverId: string,
  tripId: string,
): Promise<TripActionResult> {
  const guard = await loadOwnedPublishedTrip(driverId, tripId);
  if (!guard.ok) return guard;

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
  ]);

  await notifyTripCancelled({
    tripId,
    passengerIds: affected.map((b) => b.passengerId),
  });

  return { ok: true };
}

/**
 * Driver marks a published trip completed. Confirmed bookings become COMPLETED
 * (enabling reviews); any leftover pending bookings are cancelled.
 */
export async function completeTrip(
  driverId: string,
  tripId: string,
): Promise<TripActionResult> {
  const guard = await loadOwnedPublishedTrip(driverId, tripId);
  if (!guard.ok) return guard;

  await db.$transaction([
    db.trip.update({
      where: { id: tripId },
      data: { status: TripStatus.COMPLETED },
    }),
    db.booking.updateMany({
      where: { tripId, status: BookingStatus.CONFIRMED },
      data: { status: BookingStatus.COMPLETED },
    }),
    db.booking.updateMany({
      where: { tripId, status: BookingStatus.PENDING },
      data: { status: BookingStatus.CANCELLED, cancelledAt: new Date() },
    }),
    db.driverProfile.updateMany({
      where: { userId: driverId },
      data: { tripsCompleted: { increment: 1 } },
    }),
  ]);

  return { ok: true };
}
