import Link from "next/link";
import { redirect } from "next/navigation";
import { TripStatus } from "@prisma/client";
import { ruContent } from "@/lib/content/ru";
import { getAuthSession } from "@/lib/auth";
import { formatDeparture } from "@/lib/datetime";
import {
  listDriverTrips,
  type DriverTripsFilter,
} from "@/server/trips/queries";

const TRIP_STATUS_LABEL: Record<TripStatus, string> = {
  PUBLISHED: ruContent.myTrips.statusPublished,
  CANCELLED: ruContent.myTrips.statusCancelled,
  COMPLETED: ruContent.myTrips.statusCompleted,
};

const TRIP_STATUS_STYLE: Record<TripStatus, string> = {
  PUBLISHED: "bg-[rgba(16,185,129,0.12)] text-[rgb(5,150,105)]",
  CANCELLED: "bg-[rgba(239,68,68,0.12)] text-[rgb(185,28,28)]",
  COMPLETED: "bg-[rgba(99,102,241,0.12)] text-[rgb(67,56,202)]",
};

export default async function MyTripsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/my-trips");
  }

  const { view } = await searchParams;
  const filter: DriverTripsFilter = view === "past" ? "past" : "upcoming";

  const trips = await listDriverTrips(session.user.id, filter);

  const c = ruContent.myTrips;

  const tabs: { label: string; value: DriverTripsFilter; href: string }[] = [
    { label: c.filterUpcoming, value: "upcoming", href: "/my-trips" },
    { label: c.filterPast, value: "past", href: "/my-trips?view=past" },
  ];

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

        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent-warm">
            {c.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {c.title}
          </h1>
          <p className="mt-2 text-base text-muted">{c.description}</p>
        </div>

        <div className="mb-6 flex gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={tab.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === tab.value
                  ? "bg-accent text-white"
                  : "border border-line text-foreground hover:border-accent hover:text-accent"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {trips.length === 0 ? (
          <div className="rounded-3xl border border-line bg-surface p-10 text-center">
            <p className="text-muted">{c.empty}</p>
            <Link
              href="/trips/new"
              className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong"
            >
              {c.createFirst}
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {trips.map((trip) => (
              <li key={trip.id}>
                <Link href={`/trips/${trip.id}`} className="block">
                  <article className="rounded-3xl border border-line bg-surface p-5 shadow-[0_8px_32px_rgba(23,33,43,0.06)] transition hover:border-accent hover:shadow-[0_12px_40px_rgba(23,33,43,0.10)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">
                          {trip.pickupLabel}
                          <span className="mx-2 font-normal text-muted">→</span>
                          {trip.dropoffLabel}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {formatDeparture(trip.departureAt)}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                          <span className="font-semibold text-accent">
                            {trip.pricePerSeat} {c.currency}
                          </span>
                          <span className="text-muted/60 select-none">·</span>
                          <span className="text-muted">
                            {trip.availableSeats} / {trip.totalSeats} {c.seatsAvailable}
                          </span>
                          {trip._count.bookings > 0 && (
                            <>
                              <span className="text-muted/60 select-none">·</span>
                              <span className="font-medium text-accent-warm">
                                {trip._count.bookings} {c.pendingBookings}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${TRIP_STATUS_STYLE[trip.status]}`}
                        >
                          {TRIP_STATUS_LABEL[trip.status]}
                        </span>
                        <span className="text-xs font-semibold text-accent">
                          {c.openTrip} →
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
