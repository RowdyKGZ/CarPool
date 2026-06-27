import type { User } from "@prisma/client";

type ProfileCompletionSubject = Pick<User, "phone" | "telegramUsername">;
type DriverSetupSubject = {
  driverProfile: {
    id: string;
  } | null;
  vehicles: Array<{
    id: string;
    make: string;
    model: string;
    color: string;
    plateNumber: string;
    seatsCount: number;
  }>;
};

export function isUserProfileComplete(user: ProfileCompletionSubject) {
  // Only the phone is required to finish onboarding. telegramUsername is optional
  // (auto-filled from Telegram on OTP sign-in when available), so a returning user
  // isn't sent back to onboarding just because they have no public @username.
  return Boolean(user.phone?.trim());
}

export function isDriverSetupComplete(subject: DriverSetupSubject) {
  return (
    Boolean(subject.driverProfile) &&
    subject.vehicles.some(
      (vehicle) =>
        Boolean(vehicle.make.trim()) &&
        Boolean(vehicle.model.trim()) &&
        Boolean(vehicle.color.trim()) &&
        Boolean(vehicle.plateNumber.trim()) &&
        vehicle.seatsCount > 0,
    )
  );
}

export function normalizePhone(input: string) {
  const digits = input.replace(/[^\d+]/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("+")) {
    return `+${digits.slice(1).replace(/\D/g, "")}`;
  }

  return `+${digits.replace(/\D/g, "")}`;
}

export function normalizeTelegramUsername(input: string) {
  return input.trim().replace(/^@/, "");
}

export function normalizeVehiclePlate(input: string) {
  return input.trim().toUpperCase().replace(/\s+/g, " ");
}

export function buildDisplayName(email: string) {
  const localPart = email.split("@")[0] ?? "user";
  const sanitized = localPart.replace(/[._-]+/g, " ").trim();

  if (!sanitized) {
    return "Пользователь";
  }

  return sanitized
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
