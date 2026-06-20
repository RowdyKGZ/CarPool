"use server";

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { db } from "@/lib/db";
import { saveDriverSetup } from "@/server/users/mutations";
import { driverProfileSchema } from "@/server/users/schema";
import { isUserProfileComplete } from "@/server/users/profile";
import type { DriverOnboardingState } from "./state";

export async function saveDriverOnboarding(
  _prevState: DriverOnboardingState,
  formData: FormData,
): Promise<DriverOnboardingState> {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/onboarding/driver");
  }

  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      phone: true,
      telegramUsername: true,
      vehicles: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { id: true },
      },
    },
  });

  if (!currentUser || !isUserProfileComplete(currentUser)) {
    redirect("/onboarding/profile");
  }

  const parsed = driverProfileSchema.safeParse({
    bio: String(formData.get("bio") ?? ""),
    make: String(formData.get("make") ?? ""),
    model: String(formData.get("model") ?? ""),
    color: String(formData.get("color") ?? ""),
    plateNumber: String(formData.get("plateNumber") ?? ""),
    seatsCount: String(formData.get("seatsCount") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      message: ruContent.driverOnboarding.genericError,
      fieldErrors: {
        bio: fieldErrors.bio?.[0],
        make: fieldErrors.make?.[0],
        model: fieldErrors.model?.[0],
        color: fieldErrors.color?.[0],
        plateNumber: fieldErrors.plateNumber?.[0],
        seatsCount: fieldErrors.seatsCount?.[0],
      },
    };
  }

  const result = await saveDriverSetup(
    session.user.id,
    currentUser.vehicles[0]?.id ?? null,
    parsed.data,
  );

  if (!result.ok) {
    return {
      message: ruContent.driverOnboarding.uniquePlateError,
      fieldErrors: { plateNumber: ruContent.driverOnboarding.uniquePlateError },
    };
  }

  redirect("/dashboard");
}
