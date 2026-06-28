"use client";

import { useActionState, useCallback, useState } from "react";
import { useFormStatus } from "react-dom";
import { ruContent } from "@/lib/content/ru";
import { TripMap, type LatLng, type PinKind } from "@/components/trip-map";
import { createTrip } from "./actions";
import { initialTripNewState, type TripNewState } from "./state";

export type TripFormDefaults = {
  pickupLabel?: string;
  dropoffLabel?: string;
  pickupCoords?: LatLng | null;
  dropoffCoords?: LatLng | null;
  departureAt?: string;
  pricePerSeat?: number;
  totalSeats?: number;
  comment?: string;
};

type TripFormAction = (
  state: TripNewState,
  formData: FormData,
) => Promise<TripNewState>;

type TripNewFormProps = {
  maxSeats: number;
  vehicleName: string;
  defaultValues?: TripFormDefaults;
  action?: TripFormAction;
  tripId?: string;
  submitLabel?: string;
  pendingLabel?: string;
};

export function TripNewForm({
  maxSeats,
  vehicleName,
  defaultValues,
  action = createTrip,
  tripId,
  submitLabel,
  pendingLabel,
}: TripNewFormProps) {
  const [state, formAction] = useActionState(action, initialTripNewState);
  const c = ruContent.tripNew;
  const cm = ruContent.tripMap;

  const [pickupCoords, setPickupCoords] = useState<LatLng | null>(
    defaultValues?.pickupCoords ?? null,
  );
  const [dropoffCoords, setDropoffCoords] = useState<LatLng | null>(
    defaultValues?.dropoffCoords ?? null,
  );
  const [pickupLabel, setPickupLabel] = useState(defaultValues?.pickupLabel ?? "");
  const [dropoffLabel, setDropoffLabel] = useState(
    defaultValues?.dropoffLabel ?? "",
  );

  const handlePick = useCallback(
    (kind: PinKind, coords: LatLng, address: string | null) => {
      if (kind === "pickup") {
        setPickupCoords(coords);
        if (address) setPickupLabel(address);
      } else {
        setDropoffCoords(coords);
        if (address) setDropoffLabel(address);
      }
    },
    [],
  );

  return (
    <form action={formAction} className="space-y-5">
      {tripId ? <input type="hidden" name="tripId" value={tripId} /> : null}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{cm.heading}</p>
        <TripMap
          pickup={pickupCoords}
          dropoff={dropoffCoords}
          interactive
          onPick={handlePick}
        />
      </div>

      <input type="hidden" name="pickupLat" value={pickupCoords?.lat ?? ""} />
      <input type="hidden" name="pickupLng" value={pickupCoords?.lng ?? ""} />
      <input type="hidden" name="dropoffLat" value={dropoffCoords?.lat ?? ""} />
      <input type="hidden" name="dropoffLng" value={dropoffCoords?.lng ?? ""} />

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
          value={pickupLabel}
          onChange={(e) => setPickupLabel(e.target.value)}
          placeholder={c.pickupPlaceholder}
          className="w-full rounded-3xl border border-line bg-surface px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent"
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
          value={dropoffLabel}
          onChange={(e) => setDropoffLabel(e.target.value)}
          placeholder={c.dropoffPlaceholder}
          className="w-full rounded-3xl border border-line bg-surface px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent"
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
          defaultValue={defaultValues?.departureAt}
          className="w-full rounded-3xl border border-line bg-surface px-4 py-3 text-base text-foreground outline-none transition focus:border-accent"
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
            defaultValue={defaultValues?.pricePerSeat}
            placeholder={c.pricePlaceholder}
            className="w-full rounded-3xl border border-line bg-surface px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent"
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
            defaultValue={defaultValues?.totalSeats}
            placeholder={String(maxSeats)}
            className="w-full rounded-3xl border border-line bg-surface px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent"
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
          defaultValue={defaultValues?.comment}
          placeholder={c.commentPlaceholder}
          rows={3}
          className="w-full rounded-3xl border border-line bg-surface px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent"
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

      <TripSubmitButton label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}

function TripSubmitButton({
  label,
  pendingLabel,
}: {
  label?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  const c = ruContent.tripNew;

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (pendingLabel ?? c.pending) : (label ?? c.submit)}
    </button>
  );
}
