import { z } from "zod";

// Hidden map inputs send "" when no pin is placed — treat that as "not provided".
function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  const str = typeof value === "string" ? value.trim() : "";
  return str.length > 0 ? str : undefined;
}

const optionalLatitude = z.coerce
  .number()
  .min(-90, "Некорректная координата.")
  .max(90, "Некорректная координата.")
  .optional();
const optionalLongitude = z.coerce
  .number()
  .min(-180, "Некорректная координата.")
  .max(180, "Некорректная координата.")
  .optional();

export const tripCreateSchema = z.object({
  pickupLabel: z
    .string()
    .trim()
    .min(3, "Укажи точку посадки (минимум 3 символа).")
    .max(200, "Слишком длинное описание точки посадки."),
  dropoffLabel: z
    .string()
    .trim()
    .min(3, "Укажи точку высадки (минимум 3 символа).")
    .max(200, "Слишком длинное описание точки высадки."),
  departureAt: z.string().trim().min(1, "Укажи дату и время выезда."),
  pricePerSeat: z.coerce
    .number()
    .int("Цена должна быть целым числом.")
    .min(0, "Цена не может быть отрицательной.")
    .max(10000, "Максимальная цена за место — 10 000 сом."),
  totalSeats: z.coerce
    .number()
    .int("Количество мест должно быть целым числом.")
    .min(1, "Минимум 1 место.")
    .max(8, "Максимум 8 мест."),
  comment: z
    .string()
    .trim()
    .max(500, "Комментарий слишком длинный.")
    .transform((v) => v || null),
  pickupLat: optionalLatitude,
  pickupLng: optionalLongitude,
  dropoffLat: optionalLatitude,
  dropoffLng: optionalLongitude,
});

export type TripCreateInput = z.infer<typeof tripCreateSchema>;

/** Pulls the raw trip-creation fields out of a submitted FormData. */
export function readTripCreateForm(formData: FormData) {
  return {
    pickupLabel: String(formData.get("pickupLabel") ?? ""),
    dropoffLabel: String(formData.get("dropoffLabel") ?? ""),
    departureAt: String(formData.get("departureAt") ?? ""),
    pricePerSeat: String(formData.get("pricePerSeat") ?? ""),
    totalSeats: String(formData.get("totalSeats") ?? ""),
    comment: String(formData.get("comment") ?? ""),
    pickupLat: emptyToUndefined(formData.get("pickupLat")),
    pickupLng: emptyToUndefined(formData.get("pickupLng")),
    dropoffLat: emptyToUndefined(formData.get("dropoffLat")),
    dropoffLng: emptyToUndefined(formData.get("dropoffLng")),
  };
}
