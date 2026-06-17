"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ruContent } from "@/lib/content/ru";
import { BISHKEK_DISTRICTS } from "@/lib/districts";
import { createTrip } from "./actions";
import { initialTripNewState } from "./state";

type TripNewFormProps = {
  maxSeats: number;
  vehicleName: string;
};

export function TripNewForm({ maxSeats, vehicleName }: TripNewFormProps) {
  const [state, formAction] = useActionState(createTrip, initialTripNewState);
  const c = ruContent.tripNew;

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="fromDistrict"
          >
            {c.fromDistrictLabel}
          </label>
          <select
            id="fromDistrict"
            name="fromDistrict"
            defaultValue=""
            className="w-full rounded-3xl border border-line bg-white px-4 py-3 text-base text-foreground outline-none transition focus:border-accent"
          >
            <option value="" disabled>
              {c.selectPlaceholder}
            </option>
            {BISHKEK_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {state.fieldErrors.fromDistrict ? (
            <p className="text-sm text-[rgb(180,58,0)]">
              {state.fieldErrors.fromDistrict}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="toDistrict"
          >
            {c.toDistrictLabel}
          </label>
          <select
            id="toDistrict"
            name="toDistrict"
            defaultValue=""
            className="w-full rounded-3xl border border-line bg-white px-4 py-3 text-base text-foreground outline-none transition focus:border-accent"
          >
            <option value="" disabled>
              {c.selectPlaceholder}
            </option>
            {BISHKEK_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {state.fieldErrors.toDistrict ? (
            <p className="text-sm text-[rgb(180,58,0)]">
              {state.fieldErrors.toDistrict}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="pickupLabel"
        >
          {c.pickupLabelField}
        </label>
        <input
          id="pickupLabel"
          name="pickupLabel"
          type="text"
          placeholder={c.pickupPlaceholder}
          className="w-full rounded-3xl border border-line bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent"
        />
        {state.fieldErrors.pickupLabel ? (
          <p className="text-sm text-[rgb(180,58,0)]">
            {state.fieldErrors.pickupLabel}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="dropoffLabel"
        >
          {c.dropoffLabelField}
        </label>
        <input
          id="dropoffLabel"
          name="dropoffLabel"
          type="text"
          placeholder={c.dropoffPlaceholder}
          className="w-full rounded-3xl border border-line bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent"
        />
        {state.fieldErrors.dropoffLabel ? (
          <p className="text-sm text-[rgb(180,58,0)]">
            {state.fieldErrors.dropoffLabel}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="departureAt"
        >
          {c.departureLabel}
        </label>
        <input
          id="departureAt"
          name="departureAt"
          type="datetime-local"
          className="w-full rounded-3xl border border-line bg-white px-4 py-3 text-base text-foreground outline-none transition focus:border-accent"
        />
        {state.fieldErrors.departureAt ? (
          <p className="text-sm text-[rgb(180,58,0)]">
            {state.fieldErrors.departureAt}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="pricePerSeat"
          >
            {c.priceLabel}
          </label>
          <input
            id="pricePerSeat"
            name="pricePerSeat"
            type="number"
            min={0}
            max={10000}
            placeholder={c.pricePlaceholder}
            className="w-full rounded-3xl border border-line bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent"
          />
          {state.fieldErrors.pricePerSeat ? (
            <p className="text-sm text-[rgb(180,58,0)]">
              {state.fieldErrors.pricePerSeat}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="totalSeats"
          >
            {c.seatsLabel}
          </label>
          <input
            id="totalSeats"
            name="totalSeats"
            type="number"
            min={1}
            max={maxSeats}
            placeholder={String(maxSeats)}
            className="w-full rounded-3xl border border-line bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent"
          />
          <p className="text-sm leading-6 text-muted">
            {c.seatsHelper} {vehicleName} — до {maxSeats} мест.
          </p>
          {state.fieldErrors.totalSeats ? (
            <p className="text-sm text-[rgb(180,58,0)]">
              {state.fieldErrors.totalSeats}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="comment"
        >
          {c.commentLabel}
        </label>
        <textarea
          id="comment"
          name="comment"
          placeholder={c.commentPlaceholder}
          rows={3}
          className="w-full rounded-3xl border border-line bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent"
        />
        {state.fieldErrors.comment ? (
          <p className="text-sm text-[rgb(180,58,0)]">
            {state.fieldErrors.comment}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <div className="rounded-3xl border border-[rgba(249,115,22,0.35)] bg-[rgba(249,115,22,0.12)] px-4 py-3 text-sm text-foreground">
          {state.message}
        </div>
      ) : null}

      <TripSubmitButton />
    </form>
  );
}

function TripSubmitButton() {
  const { pending } = useFormStatus();
  const c = ruContent.tripNew;

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? c.pending : c.submit}
    </button>
  );
}
