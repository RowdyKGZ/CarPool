import { db } from "@/lib/db";
import { formatBishkekTime } from "@/lib/datetime";
import type { TripTemplateCreateInput } from "./schema";

export type TemplateResult =
  | { ok: true; id: string }
  | { ok: false; reason: "NOT_FOUND" }
  | { ok: false; reason: "DUPLICATE"; id: string };

/**
 * Finds an existing template for the same driver with the same route and
 * departure time — the identity we treat as a duplicate. `departureTime: null`
 * matches reverse templates that left the time unset.
 */
async function findDuplicateTemplateId(
  driverId: string,
  pickupLabel: string,
  dropoffLabel: string,
  departureTime: string | null,
): Promise<string | null> {
  const existing = await db.tripTemplate.findFirst({
    where: { driverId, pickupLabel, dropoffLabel, departureTime },
    select: { id: true },
  });
  return existing?.id ?? null;
}

/** Persists a new route template for the driver, refusing near-duplicates. */
export async function createTemplate(
  driverId: string,
  data: TripTemplateCreateInput,
): Promise<TemplateResult> {
  const duplicateId = await findDuplicateTemplateId(
    driverId,
    data.pickupLabel,
    data.dropoffLabel,
    data.departureTime,
  );
  if (duplicateId) return { ok: false, reason: "DUPLICATE", id: duplicateId };

  const template = await db.tripTemplate.create({
    data: {
      driverId,
      title: data.title,
      fromDistrict: data.fromDistrict ?? null,
      toDistrict: data.toDistrict ?? null,
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

/** Updates a template's fields, scoped to its owner. */
export async function updateTemplate(
  driverId: string,
  templateId: string,
  data: TripTemplateCreateInput,
): Promise<TemplateResult> {
  const { count } = await db.tripTemplate.updateMany({
    where: { id: templateId, driverId },
    data: {
      title: data.title,
      fromDistrict: data.fromDistrict ?? null,
      toDistrict: data.toDistrict ?? null,
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
  });
  return count > 0 ? { ok: true, id: templateId } : { ok: false, reason: "NOT_FOUND" };
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

  // Don't pile up identical templates if the driver taps "save as template" again.
  const duplicateId = await findDuplicateTemplateId(
    driverId,
    trip.pickupLabel,
    trip.dropoffLabel,
    formatBishkekTime(trip.departureAt),
  );
  if (duplicateId) return { ok: true, id: duplicateId };

  const template = await db.tripTemplate.create({
    data: {
      driverId,
      title: `${trip.pickupLabel} → ${trip.dropoffLabel}`,
      fromDistrict: trip.fromDistrict,
      toDistrict: trip.toDistrict,
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

  // Avoid a second reverse template if one already exists for this direction.
  const duplicateId = await findDuplicateTemplateId(
    driverId,
    source.dropoffLabel,
    source.pickupLabel,
    null,
  );
  if (duplicateId) return { ok: true, id: duplicateId };

  const reverse = await db.tripTemplate.create({
    data: {
      driverId,
      title: reverseTitle(source.title),
      fromDistrict: source.toDistrict,
      toDistrict: source.fromDistrict,
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
