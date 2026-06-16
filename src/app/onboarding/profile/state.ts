export type FieldName = "name" | "phone" | "telegramUsername";

export type OnboardingProfileState = {
  message: string | null;
  fieldErrors: Partial<Record<FieldName, string>>;
};

export const initialOnboardingProfileState: OnboardingProfileState = {
  message: null,
  fieldErrors: {},
};
