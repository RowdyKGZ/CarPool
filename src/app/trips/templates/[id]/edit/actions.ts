"use server";

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { updateTemplate } from "@/server/trip-templates/mutations";
import {
  readTripTemplateForm,
  tripTemplateCreateSchema,
} from "@/server/trip-templates/schema";
import type { TripTemplateFormState } from "../../template-state";

export async function updateTripTemplate(
  _prevState: TripTemplateFormState,
  formData: FormData,
): Promise<TripTemplateFormState> {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/trips/templates");
  }

  const templateId = String(formData.get("templateId") ?? "");
  if (!templateId) {
    redirect("/trips/templates");
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

  await updateTemplate(session.user.id, templateId, parsed.data);

  redirect("/trips/templates");
}
