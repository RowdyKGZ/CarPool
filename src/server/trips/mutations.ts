import { BookingStatus, TripStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { ACTIVE_BOOKING_STATUSES } from "@/server/bookings/schema";
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
 * Driver cancels a published trip. Cascades all active (pending/confirmed)
 * bookings to CANCELLED.
 */
export async function cancelTrip(
  driverId: string,
  tripId: string,
): Promise<TripActionResult> {
  const guard = await loadOwnedPublishedTrip(driverId, tripId);
  if (!guard.ok) return guard;

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
