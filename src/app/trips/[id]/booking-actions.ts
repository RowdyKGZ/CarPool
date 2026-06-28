"use server";

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { createBooking } from "@/server/bookings/mutations";
import { bookingCreateSchema } from "@/server/bookings/schema";
import type { BookingState } from "./booking-state";

const ERROR_MESSAGES: Record<string, string> = {
  NOT_ENOUGH_SEATS: "Недостаточно свободных мест.",
  ALREADY_BOOKED: "У тебя уже есть активная бронь на эту поездку.",
  TRIP_UNAVAILABLE: "Поездка недоступна для бронирования.",
  TRIP_DEPARTED: "Поездка уже отправилась — бронирование закрыто.",
  OWN_TRIP: "Нельзя забронировать собственную поездку.",
  UNKNOWN: "Не удалось создать бронь. Попробуй снова.",
};

export async function createBookingAction(
  _prevState: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/sign-in");
  }

  const parsed = bookingCreateSchema.safeParse({
    tripId: String(formData.get("tripId") ?? ""),
    seatsRequested: String(formData.get("seatsRequested") ?? "1"),
    note: String(formData.get("note") ?? ""),
  });

  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    return {
      message: null,
      fieldErrors: {
        seatsRequested: fe.seatsRequested?.[0],
        note: fe.note?.[0],
      },
    };
  }

  const result = await createBooking(session.user.id, parsed.data);
  if (!result.ok) {
    return { message: ERROR_MESSAGES[result.reason], fieldErrors: {} };
  }

  redirect(`/trips/${parsed.data.tripId}`);
}
