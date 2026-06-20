import { z } from "zod";

export const reviewCreateSchema = z.object({
  tripId: z.string().min(1),
  targetUserId: z.string().min(1),
  rating: z.coerce
    .number()
    .int("Поставь оценку.")
    .min(1, "Поставь оценку.")
    .max(5, "Оценка от 1 до 5."),
  comment: z
    .string()
    .trim()
    .max(500, "Комментарий слишком длинный.")
    .transform((v) => v || null),
});

export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
