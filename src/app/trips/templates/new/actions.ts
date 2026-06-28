"use server";

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { createTemplate } from "@/server/trip-templates/mutations";
import {
  readTripTemplateForm,
  tripTemplateCreateSchema,
} from "@/server/trip-templates/schema";
import type { TripTemplateFormState } from "../template-state";

export async function createTripTemplate(
  _prevState: TripTemplateFormState,
  formData: FormData,
): Promise<TripTemplateFormState> {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/trips/templates/new");
  }

  const parsed = tripTemplateCreateSchema.safeParse(
    readTripTemplateForm(formData),
  );

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const formErrors = parsed.error.flatten().formErrors;

    return {
      message: formErrors[0] ?? ruContent.tripTemplateNew.genericError,
      fieldErrors: {
        title: fieldErrors.title?.[0],
        pickupLabel: fieldErrors.pickupLabel?.[0],
        dropoffLabel: fieldErrors.dropoffLabel?.[0],
        departureTime: fieldErrors.departureTime?.[0],
        pricePerSeat: fieldErrors.pricePerSeat?.[0],
        totalSeats: fieldErrors.totalSeats?.[0],
        comment: fieldErrors.comment?.[0],
      },
    };
  }

  const result = await createTemplate(session.user.id, parsed.data);

  if (!result.ok && result.reason === "DUPLICATE") {
    return {
      message: ruContent.tripTemplateNew.duplicateError,
      fieldErrors: {},
    };
  }

  redirect("/trips/templates");
}
