export type ProfileEditFieldName = "name" | "phone" | "telegramUsername";

export type ProfileEditState = {
  message: string | null;
  fieldErrors: Partial<Record<ProfileEditFieldName, string>>;
};

export const initialProfileEditState: ProfileEditState = {
  message: null,
  fieldErrors: {},
};
