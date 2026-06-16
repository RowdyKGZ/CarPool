"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ruContent } from "@/lib/content/ru";
import { saveOnboardingProfile } from "./actions";
import { initialOnboardingProfileState } from "./state";

type ProfileOnboardingFormProps = {
  defaultValues: {
    name: string;
    phone: string;
    telegramUsername: string;
  };
};

export function ProfileOnboardingForm({
  defaultValues,
}: ProfileOnboardingFormProps) {
  const [state, formAction] = useActionState(
    saveOnboardingProfile,
    initialOnboardingProfileState,
  );
  const onboarding = ruContent.onboarding;

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="name">
          {onboarding.nameLabel}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={defaultValues.name}
          placeholder={onboarding.namePlaceholder}
          className="w-full rounded-3xl border border-line bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent"
        />
        {state.fieldErrors.name ? (
          <p className="text-sm text-[rgb(180,58,0)]">{state.fieldErrors.name}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="phone">
          {onboarding.phoneLabel}
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaultValues.phone}
          placeholder={onboarding.phonePlaceholder}
          className="w-full rounded-3xl border border-line bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent"
        />
        {state.fieldErrors.phone ? (
          <p className="text-sm text-[rgb(180,58,0)]">{state.fieldErrors.phone}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="telegramUsername">
          {onboarding.telegramLabel}
        </label>
        <input
          id="telegramUsername"
          name="telegramUsername"
          type="text"
          defaultValue={defaultValues.telegramUsername}
          placeholder={onboarding.telegramPlaceholder}
          className="w-full rounded-3xl border border-line bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent"
        />
        <p className="text-sm leading-6 text-muted">{onboarding.helper}</p>
        {state.fieldErrors.telegramUsername ? (
          <p className="text-sm text-[rgb(180,58,0)]">
            {state.fieldErrors.telegramUsername}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <div className="rounded-3xl border border-[rgba(249,115,22,0.35)] bg-[rgba(249,115,22,0.12)] px-4 py-3 text-sm text-foreground">
          {state.message}
        </div>
      ) : null}

      <ProfileSubmitButton />
    </form>
  );
}

function ProfileSubmitButton() {
  const { pending } = useFormStatus();
  const onboarding = ruContent.onboarding;

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? onboarding.pending : onboarding.submit}
    </button>
  );
}