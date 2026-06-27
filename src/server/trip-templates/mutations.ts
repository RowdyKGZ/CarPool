import { db } from "@/lib/db";
import { formatBishkekTime } from "@/lib/datetime";
import type { TripTemplateCreateInput } from "./schema";

export type TemplateResult =
  | { ok: true; id: string }
  | { ok: false; reason: "NOT_FOUND" };

/** Persists a new route template for the driver. */
export async function createTemplate(
  driverId: string,
  data: TripTemplateCreateInput,
): Promise<TemplateResult> {
  const template = await db.tripTemplate.create({
    data: {
      driverId,
      title: data.title,
      pickupLabel: data.pickupLabel,
      pickupLat: data.pickupLat ?? null,
      pickupLng: data.pickupLng ?? null,
      dropoffLabel: data.dropoffLabel,
      dropoffLat: data.dropoffLat ?? null,
      dropoffLng: data.dropoffLng ?? null,
      departureTime: data.departureTime,
      pricePerSeat: data.pricePerSeat,
      totalSeats: data.totalSeats,
      comment: data.comment,
    },
    select: { id: true },
  });
  return { ok: true, id: template.id };
}

/** Deletes a template, scoped to its owner. */
export async function deleteTemplate(
  driverId: string,
  templateId: string,
): Promise<TemplateResult> {
  const { count } = await db.tripTemplate.deleteMany({
    where: { id: templateId, driverId },
  });
  return count > 0 ? { ok: true, id: templateId } : { ok: false, reason: "NOT_FOUND" };
}

/** Builds a template from one of the driver's existing trips (scoped to owner). */
export async function createTemplateFromTrip(
  driverId: string,
  tripId: string,
): Promise<TemplateResult> {
  const trip = await db.trip.findFirst({ where: { id: tripId, driverId } });
  if (!trip) return { ok: false, reason: "NOT_FOUND" };

  const template = await db.tripTemplate.create({
    data: {
      driverId,
      title: `${trip.pickupLabel} → ${trip.dropoffLabel}`,
      pickupLabel: trip.pickupLabel,
      pickupLat: trip.pickupLat,
      pickupLng: trip.pickupLng,
      dropoffLabel: trip.dropoffLabel,
      dropoffLat: trip.dropoffLat,
      dropoffLng: trip.dropoffLng,
      departureTime: formatBishkekTime(trip.departureAt),
      pricePerSeat: trip.pricePerSeat,
      totalSeats: trip.totalSeats,
      comment: trip.comment,
    },
    select: { id: true },
  });
  return { ok: true, id: template.id };
}

/** Swaps the title's "A → B" around the arrow, if present. */
function reverseTitle(title: string | null): string | null {
  if (!title) return null;
  const parts = title.split("→");
  if (parts.length === 2) {
    return `${parts[1].trim()} → ${parts[0].trim()}`;
  }
  return `${title} (обратно)`;
}

/**
 * Creates the return-direction template from an existing one: pickup/dropoff
 * labels and coordinates are swapped. Departure time is dropped (the return leg
 * usually leaves at a different hour) so the driver sets it explicitly.
 */
export async function createReverseTemplate(
  driverId: string,
  templateId: string,
): Promise<TemplateResult> {
  const source = await db.tripTemplate.findFirst({
    where: { id: templateId, driverId },
  });
  if (!source) return { ok: false, reason: "NOT_FOUND" };

  const reverse = await db.tripTemplate.create({
    data: {
      driverId,
      title: reverseTitle(source.title),
      pickupLabel: source.dropoffLabel,
      pickupLat: source.dropoffLat,
      pickupLng: source.dropoffLng,
      dropoffLabel: source.pickupLabel,
      dropoffLat: source.pickupLat,
      dropoffLng: source.pickupLng,
      departureTime: null,
      pricePerSeat: source.pricePerSeat,
      totalSeats: source.totalSeats,
      comment: source.comment,
    },
    select: { id: true },
  });
  return { ok: true, id: reverse.id };
}
