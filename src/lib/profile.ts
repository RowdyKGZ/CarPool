import type { User } from "@prisma/client";

type ProfileCompletionSubject = Pick<User, "phone" | "telegramUsername">;

export function isUserProfileComplete(user: ProfileCompletionSubject) {
  return Boolean(user.phone?.trim()) && Boolean(user.telegramUsername?.trim());
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