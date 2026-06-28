"use client";

import { useActionState, useCallback, useState } from "react";
import { useFormStatus } from "react-dom";
import { ruContent } from "@/lib/content/ru";
import { BISHKEK_DISTRICTS } from "@/lib/districts";
import { TripMap, type LatLng, type PinKind } from "@/components/trip-map";
import {
  initialTripTemplateFormState,
  type TripTemplateFormDefaults,
  type TripTemplateFormState,
} from "./template-state";

const inputClass =
  "w-full rounded-3xl border border-line bg-surface px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent";
const errorClass = "text-sm text-[rgb(180,58,0)]";

type TemplateFormAction = (
  state: TripTemplateFormState,
  formData: FormData,
) => Promise<TripTemplateFormState>;

type TripTemplateFormProps = {
  action: TemplateFormAction;
  defaultValues?: TripTemplateFormDefaults;
  templateId?: string;
};

export function TripTemplateForm({
  action,
  defaultValues,
  templateId,
}: TripTemplateFormProps) {
  const [state, formAction] = useActionState(
    action,
    initialTripTemplateFormState,
  );
  const c = ruContent.tripTemplateNew;
  const cm = ruContent.tripMap;

  const [pickupCoords, setPickupCoords] = useState<LatLng | null>(
    defaultValues?.pickupLat != null && defaultValues?.pickupLng != null
      ? { lat: defaultValues.pickupLat, lng: defaultValues.pickupLng }
      : null,
  );
  const [dropoffCoords, setDropoffCoords] = useState<LatLng | null>(
    defaultValues?.dropoffLat != null && defaultValues?.dropoffLng != null
      ? { lat: defaultValues.dropoffLat, lng: defaultValues.dropoffLng }
      : null,
  );
  const [pickupLabel, setPickupLabel] = useState(
    defaultValues?.pickupLabel ?? "",
  );
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
      {templateId ? (
        <input type="hidden" name="templateId" value={templateId} />
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="fromDistrict"
          >
            {ruContent.tripNew.fromDistrictLabel}
          </label>
          <select
            id="fromDistrict"
            name="fromDistrict"
            defaultValue={defaultValues?.fromDistrict ?? ""}
            className={inputClass}
          >
            <option value="">{ruContent.tripNew.selectPlaceholder}</option>
            {BISHKEK_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="toDistrict"
          >
            {ruContent.tripNew.toDistrictLabel}
          </label>
          <select
            id="toDistrict"
            name="toDistrict"
            defaultValue={defaultValues?.toDistrict ?? ""}
            className={inputClass}
          >
            <option value="">{ruContent.tripNew.selectPlaceholder}</option>
            {BISHKEK_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

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
        <label className="text-sm font-medium text-foreground" htmlFor="title">
          {c.titleLabel}
        </label>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={defaultValues?.title}
          placeholder={c.titlePlaceholder}
          className={inputClass}
        />
        {state.fieldErrors.title ? (
          <p className={errorClass}>{state.fieldErrors.title}</p>
        ) : null}
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
          value={pickupLabel}
          onChange={(e) => setPickupLabel(e.target.value)}
          placeholder={c.pickupPlaceholder}
          className={inputClass}
        />
        {state.fieldErrors.pickupLabel ? (
          <p className={errorClass}>{state.fieldErrors.pickupLabel}</p>
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
          className={inputClass}
        />
        {state.fieldErrors.dropoffLabel ? (
          <p className={errorClass}>{state.fieldErrors.dropoffLabel}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="departureTime"
        >
          {c.timeLabel}
        </label>
        <input
          id="departureTime"
          name="departureTime"
          type="time"
          defaultValue={defaultValues?.departureTime}
          className={inputClass}
        />
        <p className="text-sm leading-6 text-muted">{c.timeHelper}</p>
        {state.fieldErrors.departureTime ? (
          <p className={errorClass}>{state.fieldErrors.departureTime}</p>
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
            className={inputClass}
          />
          {state.fieldErrors.pricePerSeat ? (
            <p className={errorClass}>{state.fieldErrors.pricePerSeat}</p>
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
            max={8}
            defaultValue={defaultValues?.totalSeats}
            placeholder="4"
            className={inputClass}
          />
          {state.fieldErrors.totalSeats ? (
            <p className={errorClass}>{state.fieldErrors.totalSeats}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="comment">
          {c.commentLabel}
        </label>
        <textarea
          id="comment"
          name="comment"
          defaultValue={defaultValues?.comment}
          placeholder={c.commentPlaceholder}
          rows={3}
          className={inputClass}
        />
        {state.fieldErrors.comment ? (
          <p className={errorClass}>{state.fieldErrors.comment}</p>
        ) : null}
      </div>

      {state.message ? (
        <div className="rounded-3xl border border-[rgba(249,115,22,0.35)] bg-[rgba(249,115,22,0.12)] px-4 py-3 text-sm text-foreground">
          {state.message}
        </div>
      ) : null}

      <TemplateSubmitButton />
    </form>
  );
}

function TemplateSubmitButton() {
  const { pending } = useFormStatus();
  const c = ruContent.tripTemplateNew;

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
