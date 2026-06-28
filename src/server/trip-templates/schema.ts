import { z } from "zod";
import { BISHKEK_DISTRICTS } from "@/lib/districts";

// Hidden map inputs send "" when no pin is placed — treat that as "not provided".
function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  const str = typeof value === "string" ? value.trim() : "";
  return str.length > 0 ? str : undefined;
}

// District selects send "" for "any" — coerce unknown/empty to undefined.
const optionalDistrict = z.enum(BISHKEK_DISTRICTS).optional().catch(undefined);

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

export const tripTemplateCreateSchema = z.object({
  fromDistrict: optionalDistrict,
  toDistrict: optionalDistrict,
  title: z
    .string()
    .trim()
    .max(80, "Название шаблона слишком длинное.")
    .transform((v) => v || null),
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
  departureTime: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Время в формате ЧЧ:ММ, например 08:30.")
    .or(z.literal(""))
    .transform((v) => v || null),
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

export type TripTemplateCreateInput = z.infer<typeof tripTemplateCreateSchema>;

/** Pulls the raw template fields out of a submitted FormData. */
export function readTripTemplateForm(formData: FormData) {
  return {
    fromDistrict: emptyToUndefined(formData.get("fromDistrict")),
    toDistrict: emptyToUndefined(formData.get("toDistrict")),
    title: String(formData.get("title") ?? ""),
    pickupLabel: String(formData.get("pickupLabel") ?? ""),
    dropoffLabel: String(formData.get("dropoffLabel") ?? ""),
    departureTime: String(formData.get("departureTime") ?? ""),
    pricePerSeat: String(formData.get("pricePerSeat") ?? ""),
    totalSeats: String(formData.get("totalSeats") ?? ""),
    comment: String(formData.get("comment") ?? ""),
    pickupLat: emptyToUndefined(formData.get("pickupLat")),
    pickupLng: emptyToUndefined(formData.get("pickupLng")),
    dropoffLat: emptyToUndefined(formData.get("dropoffLat")),
    dropoffLng: emptyToUndefined(formData.get("dropoffLng")),
  };
}
