"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ruContent } from "@/lib/content/ru";
import { saveDriverOnboarding } from "./actions";
import { initialDriverOnboardingState } from "./state";

type DriverOnboardingFormProps = {
  defaultValues: {
    bio: string;
    make: string;
    model: string;
    color: string;
    plateNumber: string;
    seatsCount: string;
  };
  isComplete: boolean;
};

export function DriverOnboardingForm({
  defaultValues,
  isComplete,
}: DriverOnboardingFormProps) {
  const [state, formAction] = useActionState(
    saveDriverOnboarding,
    initialDriverOnboardingState,
  );
  const driverOnboarding = ruContent.driverOnboarding;

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="bio">
          {driverOnboarding.bioLabel}
        </label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={defaultValues.bio}
          placeholder={driverOnboarding.bioPlaceholder}
          rows={4}
          className="w-full rounded-3xl border border-line bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent"
        />
        <p className="text-sm leading-6 text-muted">{driverOnboarding.bioHelper}</p>
        {state.fieldErrors.bio ? (
          <p className="text-sm text-[rgb(180,58,0)]">{state.fieldErrors.bio}</p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="make">
            {driverOnboarding.makeLabel}
          </label>
          <input
            id="make"
            name="make"
            type="text"
            defaultValue={defaultValues.make}
            placeholder={driverOnboarding.makePlaceholder}
            className="w-full rounded-3xl border border-line bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent"
          />
          {state.fieldErrors.make ? (
            <p className="text-sm text-[rgb(180,58,0)]">{state.fieldErrors.make}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="model">
            {driverOnboarding.modelLabel}
          </label>
          <input
            id="model"
            name="model"
            type="text"
            defaultValue={defaultValues.model}
            placeholder={driverOnboarding.modelPlaceholder}
            className="w-full rounded-3xl border border-line bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent"
          />
          {state.fieldErrors.model ? (
            <p className="text-sm text-[rgb(180,58,0)]">{state.fieldErrors.model}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="color">
            {driverOnboarding.colorLabel}
          </label>
          <input
            id="color"
            name="color"
            type="text"
            defaultValue={defaultValues.color}
            placeholder={driverOnboarding.colorPlaceholder}
            className="w-full rounded-3xl border border-line bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent"
          />
          {state.fieldErrors.color ? (
            <p className="text-sm text-[rgb(180,58,0)]">{state.fieldErrors.color}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="seatsCount">
            {driverOnboarding.seatsLabel}
          </label>
          <input
            id="seatsCount"
            name="seatsCount"
            type="number"
            min={1}
            max={8}
            defaultValue={defaultValues.seatsCount}
            placeholder={driverOnboarding.seatsPlaceholder}
            className="w-full rounded-3xl border border-line bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent"
          />
          <p className="text-sm leading-6 text-muted">{driverOnboarding.seatsHelper}</p>
          {state.fieldErrors.seatsCount ? (
            <p className="text-sm text-[rgb(180,58,0)]">{state.fieldErrors.seatsCount}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="plateNumber">
          {driverOnboarding.plateLabel}
        </label>
        <input
          id="plateNumber"
          name="plateNumber"
          type="text"
          defaultValue={defaultValues.plateNumber}
          placeholder={driverOnboarding.platePlaceholder}
          className="w-full rounded-3xl border border-line bg-white px-4 py-3 text-base uppercase text-foreground outline-none transition placeholder:text-muted focus:border-accent"
        />
        <p className="text-sm leading-6 text-muted">{driverOnboarding.plateHelper}</p>
        {state.fieldErrors.plateNumber ? (
          <p className="text-sm text-[rgb(180,58,0)]">{state.fieldErrors.plateNumber}</p>
        ) : null}
      </div>

      {state.message ? (
        <div className="rounded-3xl border border-[rgba(249,115,22,0.35)] bg-[rgba(249,115,22,0.12)] px-4 py-3 text-sm text-foreground">
          {state.message}
        </div>
      ) : null}

      <DriverSubmitButton isComplete={isComplete} />
    </form>
  );
}

function DriverSubmitButton({ isComplete }: { isComplete: boolean }) {
  const { pending } = useFormStatus();
  const driverOnboarding = ruContent.driverOnboarding;

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending
        ? driverOnboarding.pending
        : isComplete
          ? driverOnboarding.updateSubmit
          : driverOnboarding.submit}
    </button>
  );
}