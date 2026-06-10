"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { db } from "@/lib/db";
import { normalizePhone, normalizeTelegramUsername } from "@/lib/profile";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Укажи имя.").max(80, "Имя слишком длинное."),
  phone: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((value) => /^\+\d{9,15}$/.test(value), {
      message: "Укажи телефон в международном формате, например +996555123456.",
    }),
  telegramUsername: z
    .string()
    .trim()
    .transform(normalizeTelegramUsername)
    .refine((value) => /^[A-Za-z0-9_]{3,32}$/.test(value), {
      message: "Telegram username должен содержать 3-32 символа: буквы, цифры или _.",
    }),
});

type FieldName = "name" | "phone" | "telegramUsername";

export type OnboardingProfileState = {
  message: string | null;
  fieldErrors: Partial<Record<FieldName, string>>;
};

export const initialOnboardingProfileState: OnboardingProfileState = {
  message: null,
  fieldErrors: {},
};

export async function saveOnboardingProfile(
  _prevState: OnboardingProfileState,
  formData: FormData,
): Promise<OnboardingProfileState> {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/onboarding/profile");
  }

  const rawValues = {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    telegramUsername: String(formData.get("telegramUsername") ?? ""),
  };

  const parsed = profileSchema.safeParse(rawValues);

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

  try {
    await db.user.update({
      where: {
        id: session.user.id,
      },
      data: parsed.data,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = Array.isArray(error.meta?.target)
        ? error.meta?.target[0]
        : undefined;

      return {
        message:
          target === "phone"
            ? ruContent.onboarding.uniquePhoneError
            : ruContent.onboarding.uniqueTelegramError,
        fieldErrors: {
          phone: target === "phone" ? ruContent.onboarding.uniquePhoneError : undefined,
          telegramUsername:
            target === "telegramUsername"
              ? ruContent.onboarding.uniqueTelegramError
              : undefined,
        },
      };
    }

    throw error;
  }

  redirect("/dashboard");
}