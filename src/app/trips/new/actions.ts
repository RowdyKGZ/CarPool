"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { db } from "@/lib/db";
import { BISHKEK_DISTRICTS } from "@/lib/districts";
import { isDriverSetupComplete, isUserProfileComplete } from "@/lib/profile";
import type { TripNewState } from "./state";

const DISTRICTS_SET = new Set(BISHKEK_DISTRICTS as readonly string[]);

const tripNewSchema = z
  .object({
    fromDistrict: z
      .string()
      .min(1, "Выбери район отправления.")
      .refine((v) => DISTRICTS_SET.has(v), "Выбери район из списка."),
    toDistrict: z
      .string()
      .min(1, "Выбери район прибытия.")
      .refine((v) => DISTRICTS_SET.has(v), "Выбери район из списка."),
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
  })
  .refine((data) => data.fromDistrict !== data.toDistrict, {
    message: "Откуда и куда не могут совпадать.",
    path: ["toDistrict"],
  });

function parseBishkekDatetime(value: string): Date | null {
  // datetime-local gives "YYYY-MM-DDTHH:MM" or "YYYY-MM-DDTHH:MM:SS"
  // Append Bishkek offset (UTC+6) so the time is stored correctly in UTC
  const normalized =
    value.length === 16
      ? `${value}:00+06:00`
      : value.length === 19
        ? `${value}+06:00`
        : value;
  const date = new Date(normalized);
  return isNaN(date.getTime()) ? null : date;
}

export async function createTrip(
  _prevState: TripNewState,
  formData: FormData,
): Promise<TripNewState> {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/trips/new");
  }

  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      phone: true,
      telegramUsername: true,
      driverProfile: { select: { id: true } },
      vehicles: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: {
          id: true,
          make: true,
          model: true,
          color: true,
          plateNumber: true,
          seatsCount: true,
        },
      },
    },
  });

  if (!currentUser || !isUserProfileComplete(currentUser)) {
    redirect("/onboarding/profile");
  }

  if (!isDriverSetupComplete(currentUser)) {
    redirect("/onboarding/driver");
  }

  const primaryVehicle = currentUser.vehicles[0]!;

  const rawValues = {
    fromDistrict: String(formData.get("fromDistrict") ?? ""),
    toDistrict: String(formData.get("toDistrict") ?? ""),
    pickupLabel: String(formData.get("pickupLabel") ?? ""),
    dropoffLabel: String(formData.get("dropoffLabel") ?? ""),
    departureAt: String(formData.get("departureAt") ?? ""),
    pricePerSeat: String(formData.get("pricePerSeat") ?? ""),
    totalSeats: String(formData.get("totalSeats") ?? ""),
    comment: String(formData.get("comment") ?? ""),
  };

  const parsed = tripNewSchema.safeParse(rawValues);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const formErrors = parsed.error.flatten().formErrors;

    return {
      message: formErrors[0] ?? ruContent.tripNew.genericError,
      fieldErrors: {
        fromDistrict: fieldErrors.fromDistrict?.[0],
        toDistrict: fieldErrors.toDistrict?.[0],
        pickupLabel: fieldErrors.pickupLabel?.[0],
        dropoffLabel: fieldErrors.dropoffLabel?.[0],
        departureAt: fieldErrors.departureAt?.[0],
        pricePerSeat: fieldErrors.pricePerSeat?.[0],
        totalSeats: fieldErrors.totalSeats?.[0],
        comment: fieldErrors.comment?.[0],
      },
    };
  }

  const departureDate = parseBishkekDatetime(parsed.data.departureAt);

  if (!departureDate) {
    return {
      message: null,
      fieldErrors: { departureAt: ruContent.tripNew.invalidDateError },
    };
  }

  if (departureDate <= new Date()) {
    return {
      message: null,
      fieldErrors: { departureAt: ruContent.tripNew.pastDateError },
    };
  }

  if (parsed.data.totalSeats > primaryVehicle.seatsCount) {
    return {
      message: null,
      fieldErrors: {
        totalSeats: `Максимум ${primaryVehicle.seatsCount} мест по данным твоей машины.`,
      },
    };
  }

  const trip = await db.trip.create({
    data: {
      driverId: session.user.id,
      vehicleId: primaryVehicle.id,
      fromDistrict: parsed.data.fromDistrict,
      toDistrict: parsed.data.toDistrict,
      pickupLabel: parsed.data.pickupLabel,
      dropoffLabel: parsed.data.dropoffLabel,
      departureAt: departureDate,
      pricePerSeat: parsed.data.pricePerSeat,
      totalSeats: parsed.data.totalSeats,
      availableSeats: parsed.data.totalSeats,
      comment: parsed.data.comment,
    },
  });

  redirect(`/trips/${trip.id}`);
}
