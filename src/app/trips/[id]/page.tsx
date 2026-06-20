import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingStatus, TripStatus } from "@prisma/client";
import { ruContent } from "@/lib/content/ru";
import { getAuthSession } from "@/lib/auth";
import { formatDeparture } from "@/lib/datetime";
import {
  getActiveBookingForTrip,
  listTripBookings,
} from "@/server/bookings/queries";
import { getTripDetail } from "@/server/trips/queries";
import { TripMap, type LatLng } from "@/components/trip-map";
import { BookingForm } from "./booking-form";
import { DriverBookings, type DriverBooking } from "./driver-bookings";

const TRIP_STATUS_STYLE: Record<TripStatus, string> = {
  PUBLISHED: "bg-[rgba(16,185,129,0.12)] text-[rgb(5,150,105)]",
  CANCELLED: "bg-[rgba(239,68,68,0.12)] text-[rgb(185,28,28)]",
  COMPLETED: "bg-[rgba(99,102,241,0.12)] text-[rgb(67,56,202)]",
};

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [trip, session] = await Promise.all([getTripDetail(id), getAuthSession()]);

  if (!trip) notFound();

  const currentUserId = session?.user?.id ?? null;
  const isDriver = currentUserId === trip.driverId;

  // Driver: load all bookings for this trip
  // Passenger: load their own active booking
  const [driverBookings, activeBooking] = await Promise.all([
    isDriver ? listTripBookings(id) : Promise.resolve(null),
    !isDriver && currentUserId
      ? getActiveBookingForTrip(id, currentUserId)
      : Promise.resolve(null),
  ]);

  const c = ruContent.trip;
  const pickupCoords: LatLng | null =
    trip.pickupLat != null && trip.pickupLng != null
      ? { lat: trip.pickupLat, lng: trip.pickupLng }
      : null;
  const dropoffCoords: LatLng | null =
    trip.dropoffLat != null && trip.dropoffLng != null
      ? { lat: trip.dropoffLat, lng: trip.dropoffLng }
      : null;

  const tripStatusLabel =
    trip.status === TripStatus.PUBLISHED
      ? c.statusPublished
      : trip.status === TripStatus.CANCELLED
        ? c.statusCancelled
        : c.statusCompleted;

  // Sort bookings: PENDING first
  const sortedDriverBookings = driverBookings
    ? ([
        ...driverBookings.filter((b) => b.status === BookingStatus.PENDING),
        ...driverBookings.filter((b) => b.status !== BookingStatus.PENDING),
      ] as DriverBooking[])
    : null;

  return (
    <main className="flex-1">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-8 sm:px-8">
        <div className="mb-6">
          <Link
            href="/trips"
            className="text-sm font-medium text-muted transition hover:text-accent"
          >
            ← {ruContent.tripsList.eyebrow}
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
              className={`mt-1 shrink-0 rounded-full px-3 py-1 text-xs font-medium ${TRIP_STATUS_STYLE[trip.status]}`}
            >
              {tripStatusLabel}
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

          <div className="mt-8 border-t border-line pt-7">
            {isDriver && sortedDriverBookings ? (
              <>
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
                  {ruContent.driverBookings.sectionTitle}
                </p>
                <DriverBookings bookings={sortedDriverBookings} />
              </>
            ) : (
              <>
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
                  {ruContent.booking.sectionTitle}
                </p>
                <BookingForm
                  tripId={trip.id}
                  tripStatus={trip.status}
                  availableSeats={trip.availableSeats}
                  isLoggedIn={currentUserId !== null}
                  isDriver={isDriver}
                  activeBooking={activeBooking}
                />
              </>
            )}
          </div>
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
