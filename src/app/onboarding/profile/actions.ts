"use server";

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { saveUserProfile } from "@/server/users/mutations";
import { profileSchema } from "@/server/users/schema";
import type { OnboardingProfileState } from "./state";

export async function saveOnboardingProfile(
  _prevState: OnboardingProfileState,
  formData: FormData,
): Promise<OnboardingProfileState> {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/onboarding/profile");
  }

  const parsed = profileSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    telegramUsername: String(formData.get("telegramUsername") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      message: ruContent.onboarding.genericError,
      fieldErrors: {
        name: fieldErrors.name?.[0],
        phone: fieldErrors.phone?.[0],
        telegramUsername: fieldErrors.telegramUsername?.[0],
      },
    };
  }

  const result = await saveUserProfile(session.user.id, parsed.data);

  if (!result.ok) {
    const isPhone = result.conflict === "phone";
    return {
      message: isPhone
        ? ruContent.onboarding.uniquePhoneError
        : ruContent.onboarding.uniqueTelegramError,
      fieldErrors: {
        phone: isPhone ? ruContent.onboarding.uniquePhoneError : undefined,
        telegramUsername: isPhone
          ? undefined
          : ruContent.onboarding.uniqueTelegramError,
      },
    };
  }

  redirect(result.wasProfileComplete ? "/dashboard" : "/onboarding/driver");
}
