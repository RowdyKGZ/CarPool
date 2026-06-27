"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import {
  createReverseTemplate,
  createTemplateFromTrip,
  deleteTemplate,
} from "@/server/trip-templates/mutations";

export async function deleteTemplateAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/trips/templates");
  }

  const templateId = String(formData.get("templateId") ?? "");
  if (templateId) {
    await deleteTemplate(session.user.id, templateId);
    revalidatePath("/trips/templates");
  }
}

export async function createFromTripAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/trips/templates");
  }

  const tripId = String(formData.get("tripId") ?? "");
  if (tripId) {
    await createTemplateFromTrip(session.user.id, tripId);
    revalidatePath("/trips/templates");
  }
}

export async function reverseTemplateAction(formData: FormData) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/trips/templates");
  }

  const templateId = String(formData.get("templateId") ?? "");
  if (templateId) {
    await createReverseTemplate(session.user.id, templateId);
    revalidatePath("/trips/templates");
  }
}
