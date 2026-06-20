"use server";

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { parseBishkekDatetime } from "@/lib/datetime";
import { createTrip as createTripMutation } from "@/server/trips/mutations";
import { readTripCreateForm, tripCreateSchema } from "@/server/trips/schema";
import {
  isDriverSetupComplete,
  isUserProfileComplete,
} from "@/server/users/profile";
import { getTripPublishContext } from "@/server/users/queries";
import type { TripNewState } from "./state";

export async function createTrip(
  _prevState: TripNewState,
  formData: FormData,
): Promise<TripNewState> {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/trips/new");
  }

  const currentUser = await getTripPublishContext(session.user.id);

  if (!currentUser || !isUserProfileComplete(currentUser)) {
    redirect("/onboarding/profile");
  }

  if (!isDriverSetupComplete(currentUser)) {
    redirect("/onboarding/driver");
  }

  const primaryVehicle = currentUser.vehicles[0]!;

  const parsed = tripCreateSchema.safeParse(readTripCreateForm(formData));

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

  const trip = await createTripMutation({
    driverId: session.user.id,
    vehicleId: primaryVehicle.id,
    departureAt: departureDate,
    data: parsed.data,
  });

  redirect(`/trips/${trip.id}`);
}
