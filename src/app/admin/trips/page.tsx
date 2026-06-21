import Link from "next/link";
import { TripStatus } from "@prisma/client";
import { ruContent } from "@/lib/content/ru";
import { formatDeparture } from "@/lib/datetime";
import { listTripsForAdmin } from "@/server/admin/queries";
import { hideTripAction } from "../actions";

const STATUS_LABEL: Record<TripStatus, string> = {
  PUBLISHED: ruContent.trip.statusPublished,
  CANCELLED: ruContent.trip.statusCancelled,
  COMPLETED: ruContent.trip.statusCompleted,
};

const STATUS_STYLE: Record<TripStatus, string> = {
  PUBLISHED: "bg-[rgba(16,185,129,0.12)] text-[rgb(5,150,105)]",
  CANCELLED: "bg-[rgba(239,68,68,0.12)] text-[rgb(185,28,28)]",
  COMPLETED: "bg-[rgba(99,102,241,0.12)] text-[rgb(67,56,202)]",
};

export default async function AdminTripsPage() {
  const trips = await listTripsForAdmin();
  const a = ruContent.admin;

  if (trips.length === 0) {
    return <p className="text-muted">{a.empty}</p>;
  }

  return (
    <ul className="space-y-3">
      {trips.map((trip) => (
        <li key={trip.id} className="rounded-3xl border border-line bg-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-foreground">
                {trip.pickupLabel}
                <span className="mx-2 font-normal text-muted">→</span>
                {trip.dropoffLabel}
              </p>
              <p className="mt-1 text-sm text-muted">
                {formatDeparture(trip.departureAt)} · {trip.driver.name}
              </p>
              <p className="mt-1 text-xs text-muted">
                {trip.availableSeats} / {trip.totalSeats}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[trip.status]}`}
            >
              {STATUS_LABEL[trip.status]}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href={`/trips/${trip.id}`}
              className="text-sm font-medium text-accent transition hover:text-accent-strong"
            >
              {a.openTrip} →
            </Link>
            {trip.status === TripStatus.PUBLISHED && (
              <form action={hideTripAction}>
                <input type="hidden" name="tripId" value={trip.id} />
                <button
                  type="submit"
                  className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-[rgb(185,28,28)] hover:text-[rgb(185,28,28)]"
                >
                  {a.hideTrip}
                </button>
              </form>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
