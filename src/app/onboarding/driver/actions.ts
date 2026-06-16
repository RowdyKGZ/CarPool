"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { db } from "@/lib/db";
import {
  isUserProfileComplete,
  normalizeVehiclePlate,
} from "@/lib/profile";
import type { DriverOnboardingState } from "./state";

const driverProfileSchema = z.object({
  bio: z
    .string()
    .trim()
    .max(300, "Описание должно быть не длиннее 300 символов.")
    .transform((value) => value || null),
  make: z.string().trim().min(2, "Укажи марку машины.").max(60, "Марка слишком длинная."),
  model: z
    .string()
    .trim()
    .min(1, "Укажи модель машины.")
    .max(60, "Модель слишком длинная."),
  color: z.string().trim().min(2, "Укажи цвет машины.").max(40, "Цвет слишком длинный."),
  plateNumber: z
    .string()
    .trim()
    .transform(normalizeVehiclePlate)
    .refine((value) => /^[A-Z0-9\-\s]{5,16}$/.test(value), {
      message: "Укажи корректный госномер длиной 5-16 символов: буквы, цифры, пробел или дефис.",
    }),
  seatsCount: z.coerce.number().int().min(1, "Минимум 1 место.").max(8, "Для MVP пока поддерживаем до 8 мест."),
});

export async function saveDriverOnboarding(
  _prevState: DriverOnboardingState,
  formData: FormData,
): Promise<DriverOnboardingState> {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/onboarding/driver");
  }

  const currentUser = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      phone: true,
      telegramUsername: true,
      vehicles: {
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
        select: {
          id: true,
        },
      },
    },
  });

  if (!currentUser || !isUserProfileComplete(currentUser)) {
    redirect("/onboarding/profile");
  }

  const rawValues = {
    bio: String(formData.get("bio") ?? ""),
    make: String(formData.get("make") ?? ""),
    model: String(formData.get("model") ?? ""),
    color: String(formData.get("color") ?? ""),
    plateNumber: String(formData.get("plateNumber") ?? ""),
    seatsCount: String(formData.get("seatsCount") ?? ""),
  };

  const parsed = driverProfileSchema.safeParse(rawValues);

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

  const primaryVehicle = currentUser.vehicles[0];

  try {
    await db.$transaction([
      db.driverProfile.upsert({
        where: {
          userId: session.user.id,
        },
        update: {
          bio: parsed.data.bio,
        },
        create: {
          userId: session.user.id,
          bio: parsed.data.bio,
        },
      }),
      primaryVehicle
        ? db.vehicle.update({
            where: {
              id: primaryVehicle.id,
            },
            data: {
              make: parsed.data.make,
              model: parsed.data.model,
              color: parsed.data.color,
              plateNumber: parsed.data.plateNumber,
              seatsCount: parsed.data.seatsCount,
            },
          })
        : db.vehicle.create({
            data: {
              userId: session.user.id,
              make: parsed.data.make,
              model: parsed.data.model,
              color: parsed.data.color,
              plateNumber: parsed.data.plateNumber,
              seatsCount: parsed.data.seatsCount,
            },
          }),
    ]);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target[0]
        : undefined;

      return {
        message: ruContent.driverOnboarding.uniquePlateError,
        fieldErrors: {
          plateNumber:
            target === "plateNumber"
              ? ruContent.driverOnboarding.uniquePlateError
              : undefined,
        },
      };
    }

    throw error;
  }

  redirect("/dashboard");
}