"use server";

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { cancelTrip, completeTrip } from "@/server/trips/mutations";
import type { TripControlsState } from "./trip-controls-state";

async function runTripAction(
  formData: FormData,
  mutate: (driverId: string, tripId: string) => Promise<{ ok: boolean }>,
): Promise<TripControlsState> {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/sign-in");
  }

  const tripId = String(formData.get("tripId") ?? "");
  if (!tripId) return { error: ruContent.driverTrip.error };

  const result = await mutate(session.user.id, tripId);
  if (!result.ok) {
    return { error: ruContent.driverTrip.error };
  }

  redirect(`/trips/${tripId}`);
}

export async function cancelTripAction(
  _prevState: TripControlsState,
  formData: FormData,
): Promise<TripControlsState> {
  return runTripAction(formData, cancelTrip);
}

export async function completeTripAction(
  _prevState: TripControlsState,
  formData: FormData,
): Promise<TripControlsState> {
  return runTripAction(formData, completeTrip);
}
