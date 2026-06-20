import { db } from "@/lib/db";
import type { TripCreateInput } from "./schema";

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
