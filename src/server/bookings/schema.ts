import { BookingStatus } from "@prisma/client";
import { z } from "zod";

/** Statuses that count as an "active" booking (occupying a seat). */
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
];

export const bookingCreateSchema = z.object({
  tripId: z.string().min(1),
  seatsRequested: z.coerce.number().int().min(1).max(8),
  note: z
    .string()
    .trim()
    .max(300, "Заметка слишком длинная.")
    .transform((v) => v || null),
});

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
