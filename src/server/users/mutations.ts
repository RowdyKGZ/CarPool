import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { isUserProfileComplete } from "./profile";
import type { DriverProfileInput, ProfileInput } from "./schema";

/** A unique-constraint conflict mapped back to the form field that caused it. */
export type ConflictField = "phone" | "telegramUsername" | "plateNumber";

export type SaveProfileResult =
  | { ok: true; wasProfileComplete: boolean }
  | { ok: false; conflict: ConflictField };

export type SaveDriverSetupResult =
  | { ok: true }
  | { ok: false; conflict: ConflictField };

function conflictField(error: unknown): ConflictField | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = Array.isArray(error.meta?.target)
      ? error.meta?.target[0]
      : undefined;
    if (
      target === "phone" ||
      target === "telegramUsername" ||
      target === "plateNumber"
    ) {
      return target;
    }
    return "phone";
  }
  return null;
}

export async function saveUserProfile(
  userId: string,
  data: ProfileInput,
): Promise<SaveProfileResult> {
  const existingUser = await db.user.findUnique({
    where: { id: userId },
    select: { phone: true, telegramUsername: true },
  });
  const wasProfileComplete = existingUser
    ? isUserProfileComplete(existingUser)
    : false;

  // A blank telegramUsername must not wipe an existing (e.g. Telegram-auto-filled)
  // value — only write it when the user actually provided one.
  const { telegramUsername, ...rest } = data;
  const updateData =
    telegramUsername != null ? { ...rest, telegramUsername } : rest;

  try {
    await db.user.update({ where: { id: userId }, data: updateData });
  } catch (error) {
    const conflict = conflictField(error);
    if (conflict) return { ok: false, conflict };
    throw error;
  }

  return { ok: true, wasProfileComplete };
}

export async function saveDriverSetup(
  userId: string,
  primaryVehicleId: string | null,
  data: DriverProfileInput,
): Promise<SaveDriverSetupResult> {
  const { bio, ...vehicle } = data;

  try {
    await db.$transaction([
      db.driverProfile.upsert({
        where: { userId },
        update: { bio },
        create: { userId, bio },
      }),
      primaryVehicleId
        ? db.vehicle.update({ where: { id: primaryVehicleId }, data: vehicle })
        : db.vehicle.create({ data: { userId, ...vehicle } }),
    ]);
  } catch (error) {
    const conflict = conflictField(error);
    if (conflict) return { ok: false, conflict };
    throw error;
  }

  return { ok: true };
}
