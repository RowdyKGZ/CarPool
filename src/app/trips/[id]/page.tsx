import Link from "next/link";
import { notFound } from "next/navigation";
import { TripStatus } from "@prisma/client";
import { ruContent } from "@/lib/content/ru";
import { db } from "@/lib/db";
import { TripMap, type LatLng } from "@/components/trip-map";

function formatDeparture(date: Date) {
  return date.toLocaleString("ru-RU", {
    timeZone: "Asia/Bishkek",
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_STYLE: Record<TripStatus, string> = {
  PUBLISHED:
    "bg-[rgba(16,185,129,0.12)] text-[rgb(5,150,105)]",
  CANCELLED: "bg-[rgba(239,68,68,0.12)] text-[rgb(185,28,28)]",
  COMPLETED: "bg-[rgba(99,102,241,0.12)] text-[rgb(67,56,202)]",
};

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const trip = await db.trip.findUnique({
    where: { id },
    include: {
      driver: {
        select: {
          name: true,
          telegramUsername: true,
          driverProfile: {
            select: { bio: true },
          },
        },
      },
      vehicle: {
        select: {
          make: true,
          model: true,
          color: true,
          plateNumber: true,
        },
      },
    },
  });

  if (!trip) {
    notFound();
  }

  const c = ruContent.trip;
  const pickupCoords: LatLng | null =
    trip.pickupLat != null && trip.pickupLng != null
      ? { lat: trip.pickupLat, lng: trip.pickupLng }
      : null;
  const dropoffCoords: LatLng | null =
    trip.dropoffLat != null && trip.dropoffLng != null
      ? { lat: trip.dropoffLat, lng: trip.dropoffLng }
      : null;
  const statusLabel =
    trip.status === TripStatus.PUBLISHED
      ? c.statusPublished
      : trip.status === TripStatus.CANCELLED
        ? c.statusCancelled
        : c.statusCompleted;

  return (
    <main className="flex-1">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-8 sm:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted transition hover:text-accent"
          >
            ← {c.backToDashboard}
          </Link>
        </div>

        <section className="rounded-[36px] border border-line bg-surface p-7 shadow-[0_24px_80px_rgba(23,33,43,0.08)] sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent-warm">
                {c.eyebrow}
              </p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {trip.pickupLabel} → {trip.dropoffLabel}
              </h1>
            </div>
            <span
              className={`mt-1 shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[trip.status]}`}
            >
              {statusLabel}
            </span>
          </div>

          <p className="mt-2 text-base font-medium text-accent">
            {formatDeparture(trip.departureAt)}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <TripCard label={c.pickup} value={trip.pickupLabel} />
            <TripCard label={c.dropoff} value={trip.dropoffLabel} />
            <TripCard
              label={c.price}
              value={`${trip.pricePerSeat} ${c.currency}`}
            />
            <TripCard
              label={c.seats}
              value={`${trip.availableSeats} / ${trip.totalSeats}`}
            />
            <TripCard label={c.driver} value={trip.driver.name} />
            <TripCard
              label={c.vehicle}
              value={`${trip.vehicle.make} ${trip.vehicle.model} · ${trip.vehicle.color} · ${trip.vehicle.plateNumber}`}
            />
          </div>

          {trip.comment ? (
            <div className="mt-3">
              <TripCard label={c.comment} value={trip.comment} />
            </div>
          ) : null}

          {pickupCoords || dropoffCoords ? (
            <div className="mt-6 space-y-2">
              <p className="text-sm font-medium text-foreground">
                {ruContent.tripMap.routePreview}
              </p>
              <TripMap pickup={pickupCoords} dropoff={dropoffCoords} />
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function TripCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-3xl border border-line bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </article>
  );
}
