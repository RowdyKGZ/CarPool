"use server";

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { cancelBooking } from "@/server/bookings/mutations";
import type { CancelBookingState } from "./state";

export async function cancelBookingAction(
  _prevState: CancelBookingState,
  formData: FormData,
): Promise<CancelBookingState> {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/my-bookings");
  }

  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return { error: ruContent.myBookings.cancelError };

  const result = await cancelBooking(session.user.id, bookingId);
  if (!result.ok) {
    return { error: ruContent.myBookings.cancelError };
  }

  redirect("/my-bookings");
}
