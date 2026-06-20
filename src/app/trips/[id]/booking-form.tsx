"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { BookingStatus, TripStatus } from "@prisma/client";
import { ruContent } from "@/lib/content/ru";
import { createBookingAction } from "./booking-actions";
import { initialBookingState } from "./booking-state";

const c = ruContent.booking;

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: c.statusPending,
  CONFIRMED: c.statusConfirmed,
  REJECTED: c.statusRejected,
  CANCELLED: c.statusCancelled,
  COMPLETED: c.statusCompleted,
  NO_SHOW: c.statusNoShow,
};

const STATUS_STYLE: Record<BookingStatus, string> = {
  PENDING: "bg-[rgba(249,115,22,0.10)] text-[rgb(194,65,12)]",
  CONFIRMED: "bg-[rgba(16,185,129,0.12)] text-[rgb(5,150,105)]",
  REJECTED: "bg-[rgba(239,68,68,0.12)] text-[rgb(185,28,28)]",
  CANCELLED: "bg-[rgba(239,68,68,0.12)] text-[rgb(185,28,28)]",
  COMPLETED: "bg-[rgba(99,102,241,0.12)] text-[rgb(67,56,202)]",
  NO_SHOW: "bg-[rgba(239,68,68,0.12)] text-[rgb(185,28,28)]",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-60"
    >
      {pending ? c.pending : c.submit}
    </button>
  );
}

type ActiveBooking = {
  status: BookingStatus;
  seatsRequested: number;
};

type Props = {
  tripId: string;
  tripStatus: TripStatus;
  availableSeats: number;
  isLoggedIn: boolean;
  isDriver: boolean;
  activeBooking: ActiveBooking | null;
};

export function BookingForm({
  tripId,
  tripStatus,
  availableSeats,
  isLoggedIn,
  isDriver,
  activeBooking,
}: Props) {
  const [state, action] = useActionState(
    createBookingAction,
    initialBookingState,
  );

  if (isDriver) return null;

  if (tripStatus !== TripStatus.PUBLISHED) {
    return (
      <p className="text-sm text-muted">{c.tripNotAvailable}</p>
    );
  }

  if (!isLoggedIn) {
    return (
      <a
        href={`/auth/sign-in?callbackUrl=/trips/${tripId}`}
        className="block w-full rounded-full bg-accent py-3 text-center text-sm font-semibold text-white transition hover:bg-accent-strong"
      >
        {c.loginCta}
      </a>
    );
  }

  if (activeBooking) {
    return (
      <div
        className={`rounded-2xl px-4 py-3 text-sm font-medium ${STATUS_STYLE[activeBooking.status]}`}
      >
        {STATUS_LABEL[activeBooking.status]}
        {activeBooking.seatsRequested > 1 && (
          <span className="ml-2 font-normal opacity-75">
            · {activeBooking.seatsRequested} {c.seatsUnit}
          </span>
        )}
      </div>
    );
  }

  if (availableSeats === 0) {
    return <p className="text-sm font-medium text-muted">{c.noSeats}</p>;
  }

  const maxSeats = Math.min(availableSeats, 4);
  const seatOptions = Array.from({ length: maxSeats }, (_, i) => i + 1);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="tripId" value={tripId} />

      {state.message && (
        <p className="rounded-2xl bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-[rgb(185,28,28)]">
          {state.message}
        </p>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {c.seatsLabel}
        </label>
        {maxSeats === 1 ? (
          <input type="hidden" name="seatsRequested" value="1" />
        ) : (
          <select
            name="seatsRequested"
            defaultValue="1"
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            {seatOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        )}
        {state.fieldErrors.seatsRequested && (
          <p className="mt-1 text-xs text-[rgb(185,28,28)]">
            {state.fieldErrors.seatsRequested}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {c.noteLabel}
        </label>
        <textarea
          name="note"
          placeholder={c.notePlaceholder}
          rows={2}
          className="w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
        {state.fieldErrors.note && (
          <p className="mt-1 text-xs text-[rgb(185,28,28)]">
            {state.fieldErrors.note}
          </p>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}
