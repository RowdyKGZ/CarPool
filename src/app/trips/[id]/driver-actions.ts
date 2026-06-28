"use server";

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import {
  confirmBooking as confirmBookingMutation,
  markBookingAttended as markBookingAttendedMutation,
  markBookingNoShow as markBookingNoShowMutation,
  rejectBooking as rejectBookingMutation,
  type ModerateBookingResult,
} from "@/server/bookings/mutations";
import type { DriverActionState } from "./driver-state";

const ERROR_MESSAGES: Record<string, string> = {
  NOT_FOUND: "Бронь не найдена.",
  FORBIDDEN: "Нет доступа.",
  ALREADY_HANDLED: "Бронь уже обработана.",
  INVALID_STATE: "Действие недоступно для этой брони.",
};

function toState(result: ModerateBookingResult): DriverActionState {
  if (result.ok) {
    redirect(`/trips/${result.tripId}`);
  }
  return { error: ERROR_MESSAGES[result.reason] };
}

export async function confirmBooking(
  _prevState: DriverActionState,
  formData: FormData,
): Promise<DriverActionState> {
  const session = await getAuthSession();
  if (!session?.user?.id) return { error: "Необходима авторизация." };

  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return { error: "Не указана бронь." };

  return toState(await confirmBookingMutation(session.user.id, bookingId));
}

export async function rejectBooking(
  _prevState: DriverActionState,
  formData: FormData,
): Promise<DriverActionState> {
  const session = await getAuthSession();
  if (!session?.user?.id) return { error: "Необходима авторизация." };

  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return { error: "Не указана бронь." };

  return toState(await rejectBookingMutation(session.user.id, bookingId));
}

export async function markNoShow(
  _prevState: DriverActionState,
  formData: FormData,
): Promise<DriverActionState> {
  const session = await getAuthSession();
  if (!session?.user?.id) return { error: "Необходима авторизация." };

  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return { error: "Не указана бронь." };

  return toState(await markBookingNoShowMutation(session.user.id, bookingId));
}

export async function markAttended(
  _prevState: DriverActionState,
  formData: FormData,
): Promise<DriverActionState> {
  const session = await getAuthSession();
  if (!session?.user?.id) return { error: "Необходима авторизация." };

  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return { error: "Не указана бронь." };

  return toState(await markBookingAttendedMutation(session.user.id, bookingId));
}
