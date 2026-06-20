"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { BookingStatus } from "@prisma/client";
import { ruContent } from "@/lib/content/ru";
import { confirmBooking, rejectBooking } from "./driver-actions";
import { initialDriverActionState as INITIAL } from "./driver-state";

const c = ruContent.driverBookings;

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

export type DriverBooking = {
  id: string;
  status: BookingStatus;
  seatsRequested: number;
  note: string | null;
  passenger: {
    name: string;
    phone: string | null;
    telegramUsername: string | null;
  };
};

export function DriverBookings({ bookings }: { bookings: DriverBooking[] }) {
  if (bookings.length === 0) {
    return <p className="text-sm text-muted">{c.empty}</p>;
  }

  return (
    <ul className="space-y-3">
      {bookings.map((b) => (
        <DriverBookingCard key={b.id} booking={b} />
      ))}
    </ul>
  );
}

function DriverBookingCard({ booking }: { booking: DriverBooking }) {
  const [confirmState, confirmAction] = useActionState(confirmBooking, INITIAL);
  const [rejectState, rejectAction] = useActionState(rejectBooking, INITIAL);
  const isPending = booking.status === BookingStatus.PENDING;

  return (
    <li className="rounded-3xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{booking.passenger.name}</p>
          <p className="mt-0.5 text-sm text-muted">
            {booking.seatsRequested} {c.seatsUnit}
            {booking.passenger.phone && (
              <> · <span>{booking.passenger.phone}</span></>
            )}
            {booking.passenger.telegramUsername && (
              <> · <span>@{booking.passenger.telegramUsername}</span></>
            )}
          </p>
          {booking.note && (
            <p className="mt-2 rounded-2xl bg-surface-strong px-3 py-2 text-sm text-foreground">
              {booking.note}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[booking.status]}`}
        >
          {STATUS_LABEL[booking.status]}
        </span>
      </div>

      {isPending && (
        <div className="mt-4 flex gap-2">
          <form action={confirmAction} className="flex-1">
            <input type="hidden" name="bookingId" value={booking.id} />
            <ActionButton
              label={c.confirm}
              pendingLabel={c.confirmPending}
              className="w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-60"
            />
          </form>
          <form action={rejectAction} className="flex-1">
            <input type="hidden" name="bookingId" value={booking.id} />
            <ActionButton
              label={c.reject}
              pendingLabel={c.rejectPending}
              className="w-full rounded-full border border-line py-2.5 text-sm font-semibold text-foreground transition hover:border-[rgb(185,28,28)] hover:text-[rgb(185,28,28)] disabled:opacity-60"
            />
          </form>
        </div>
      )}

      {(confirmState.error ?? rejectState.error) && (
        <p className="mt-2 text-xs text-[rgb(185,28,28)]">
          {confirmState.error ?? rejectState.error}
        </p>
      )}
    </li>
  );
}

function ActionButton({
  label,
  pendingLabel,
  className,
}: {
  label: string;
  pendingLabel: string;
  className: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : label}
    </button>
  );
}
