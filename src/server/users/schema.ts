import { z } from "zod";
import {
  normalizePhone,
  normalizeTelegramUsername,
  normalizeVehiclePlate,
} from "./profile";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Укажи имя.").max(80, "Имя слишком длинное."),
  phone: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((value) => /^\+\d{9,15}$/.test(value), {
      message: "Укажи телефон в международном формате, например +996555123456.",
    }),
  telegramUsername: z
    .string()
    .trim()
    .transform(normalizeTelegramUsername)
    .refine((value) => /^[A-Za-z0-9_]{3,32}$/.test(value), {
      message:
        "Telegram username должен содержать 3-32 символа: буквы, цифры или _.",
    }),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const driverProfileSchema = z.object({
  bio: z
    .string()
    .trim()
    .max(300, "Описание должно быть не длиннее 300 символов.")
    .transform((value) => value || null),
  make: z
    .string()
    .trim()
    .min(2, "Укажи марку машины.")
    .max(60, "Марка слишком длинная."),
  model: z
    .string()
    .trim()
    .min(1, "Укажи модель машины.")
    .max(60, "Модель слишком длинная."),
  color: z
    .string()
    .trim()
    .min(2, "Укажи цвет машины.")
    .max(40, "Цвет слишком длинный."),
  plateNumber: z
    .string()
    .trim()
    .transform(normalizeVehiclePlate)
    .refine((value) => /^[A-Z0-9\-\s]{5,16}$/.test(value), {
      message:
        "Укажи корректный госномер длиной 5-16 символов: буквы, цифры, пробел или дефис.",
    }),
  seatsCount: z.coerce
    .number()
    .int()
    .min(1, "Минимум 1 место.")
    .max(8, "Для MVP пока поддерживаем до 8 мест."),
});

export type DriverProfileInput = z.infer<typeof driverProfileSchema>;
