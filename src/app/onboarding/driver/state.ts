export type FieldName = "bio" | "make" | "model" | "color" | "plateNumber" | "seatsCount";

export type DriverOnboardingState = {
  message: string | null;
  fieldErrors: Partial<Record<FieldName, string>>;
};

export const initialDriverOnboardingState: DriverOnboardingState = {
  message: null,
  fieldErrors: {},
};
