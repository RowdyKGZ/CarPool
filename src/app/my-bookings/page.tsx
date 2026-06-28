import Link from "next/link";
import { redirect } from "next/navigation";
import { BookingStatus } from "@prisma/client";
import { ruContent } from "@/lib/content/ru";
import { getAuthSession } from "@/lib/auth";
import { formatDeparture } from "@/lib/datetime";
import {
  listActivePassengerBookings,
  listPastPassengerBookings,
} from "@/server/bookings/queries";
import { autoCompleteDepartedTrips } from "@/server/trips/mutations";
import { Pagination } from "@/components/pagination";
import { CancelBookingButton } from "./cancel-booking-button";

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: ruContent.booking.statusPending,
  CONFIRMED: ruContent.booking.statusConfirmed,
  REJECTED: ruContent.booking.statusRejected,
  CANCELLED: ruContent.booking.statusCancelled,
  COMPLETED: ruContent.booking.statusCompleted,
  NO_SHOW: ruContent.booking.statusNoShow,
};

const STATUS_STYLE: Record<BookingStatus, string> = {
  PENDING: "bg-[rgba(249,115,22,0.10)] text-[rgb(194,65,12)]",
  CONFIRMED: "bg-[rgba(16,185,129,0.12)] text-[rgb(5,150,105)]",
  REJECTED: "bg-[rgba(239,68,68,0.12)] text-[rgb(185,28,28)]",
  CANCELLED: "bg-[rgba(239,68,68,0.12)] text-[rgb(185,28,28)]",
  COMPLETED: "bg-[rgba(99,102,241,0.12)] text-[rgb(67,56,202)]",
  NO_SHOW: "bg-[rgba(239,68,68,0.12)] text-[rgb(185,28,28)]",
};

export default async function MyBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/my-bookings");
  }

  const { page: pageParam } = await searchParams;
  const requestedPage = Math.max(1, Number(pageParam) || 1);

  await autoCompleteDepartedTrips({
    bookings: { some: { passengerId: session.user.id } },
  });
  const [active, pastResult] = await Promise.all([
    listActivePassengerBookings(session.user.id),
    listPastPassengerBookings(session.user.id, requestedPage),
  ]);
  const { bookings: past, page, hasMore } = pastResult;
  const isEmpty = active.length === 0 && past.length === 0;
  const c = ruContent.myBookings;

  return (
    <main className="flex-1">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-8 sm:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted transition hover:text-accent"
          >
            ← {ruContent.dashboard.eyebrow}
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent-warm">
            {c.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {c.title}
          </h1>
          <p className="mt-2 text-base text-muted">{c.description}</p>
        </div>

        {isEmpty ? (
          <div className="rounded-3xl border border-line bg-surface p-10 text-center">
            <p className="text-muted">{c.empty}</p>
            <Link
              href="/trips"
              className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong"
            >
              {ruContent.tripsList.title}
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {active.length > 0 && (
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {c.sectionActive}
                </p>
                <ul className="space-y-3">
                  {active.map((b) => (
                    <BookingCard key={b.id} booking={b} cancellable />
                  ))}
                </ul>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {c.sectionPast}
                </p>
                <ul className="space-y-3">
                  {past.map((b) => (
                    <BookingCard key={b.id} booking={b} />
                  ))}
                </ul>
                <Pagination page={page} hasMore={hasMore} basePath="/my-bookings" />
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

type BookingWithTrip = {
  id: string;
  status: BookingStatus;
  seatsRequested: number;
  note: string | null;
  trip: {
    id: string;
    pickupLabel: string;
    dropoffLabel: string;
    departureAt: Date;
    pricePerSeat: number;
    driver: {
      name: string;
      phone: string | null;
      telegramUsername: string | null;
    };
  };
};

function BookingCard({
  booking,
  cancellable = false,
}: {
  booking: BookingWithTrip;
  cancellable?: boolean;
}) {
  const c = ruContent.myBookings;
  const isConfirmed = booking.status === BookingStatus.CONFIRMED;

  return (
    <li className="rounded-3xl border border-line bg-surface p-5 shadow-[0_8px_32px_rgba(23,33,43,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">
            {booking.trip.pickupLabel}
            <span className="mx-2 font-normal text-muted">→</span>
            {booking.trip.dropoffLabel}
          </p>
          <p className="mt-1 text-sm text-muted">
            {formatDeparture(booking.trip.departureAt)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {booking.trip.driver.name} · {booking.trip.pricePerSeat} {c.currency} · {booking.seatsRequested} мест
          </p>
          {isConfirmed && (
            <div className="mt-3 rounded-2xl border border-line bg-surface-strong px-3 py-2 text-sm">
              <p className="text-xs font-medium text-muted">{c.contactDriver}</p>
              <p className="mt-0.5 font-medium text-foreground">
                {booking.trip.driver.phone ?? "—"}
                {booking.trip.driver.telegramUsername && (
                  <> · @{booking.trip.driver.telegramUsername}</>
                )}
              </p>
            </div>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[booking.status]}`}
        >
          {STATUS_LABEL[booking.status]}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Link
          href={`/trips/${booking.trip.id}`}
          className="text-sm font-medium text-accent transition hover:text-accent-strong"
        >
          {c.openTrip} →
        </Link>
        {cancellable && <CancelBookingButton bookingId={booking.id} />}
      </div>
    </li>
  );
}
