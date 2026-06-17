"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { db } from "@/lib/db";
import { isDriverSetupComplete, isUserProfileComplete } from "@/lib/profile";
import type { TripNewState } from "./state";

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

const tripNewSchema = z
  .object({
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

  const parsed = tripNewSchema.safeParse(rawValues);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const formErrors = parsed.error.flatten().formErrors;

    return {
      message: formErrors[0] ?? ruContent.tripNew.genericError,
      fieldErrors: {
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
      pickupLabel: parsed.data.pickupLabel,
      pickupLat: parsed.data.pickupLat ?? null,
      pickupLng: parsed.data.pickupLng ?? null,
      dropoffLabel: parsed.data.dropoffLabel,
      dropoffLat: parsed.data.dropoffLat ?? null,
      dropoffLng: parsed.data.dropoffLng ?? null,
      departureAt: departureDate,
      pricePerSeat: parsed.data.pricePerSeat,
      totalSeats: parsed.data.totalSeats,
      availableSeats: parsed.data.totalSeats,
      comment: parsed.data.comment,
    },
  });

  redirect(`/trips/${trip.id}`);
}
