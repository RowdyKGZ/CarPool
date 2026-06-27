"use server";

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { cancelTrip, completeTrip, repeatTrip } from "@/server/trips/mutations";
import { createTemplateFromTrip } from "@/server/trip-templates/mutations";
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

/** Saves the trip as a reusable route template, then opens the templates list. */
export async function saveTripAsTemplateAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/sign-in");
  }

  const tripId = String(formData.get("tripId") ?? "");
  if (tripId) {
    await createTemplateFromTrip(session.user.id, tripId);
  }
  redirect("/trips/templates");
}

/** Clones the trip into a new one for the next occurrence, then opens it. */
export async function repeatTripAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/sign-in");
  }

  const tripId = String(formData.get("tripId") ?? "");
  const result = tripId
    ? await repeatTrip(session.user.id, tripId)
    : { ok: false as const, reason: "NOT_FOUND" as const };

  redirect(result.ok ? `/trips/${result.id}` : "/my-trips");
}
