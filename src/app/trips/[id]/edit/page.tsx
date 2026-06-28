import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TripStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { formatBishkekDatetimeLocal } from "@/lib/datetime";
import { getTripDetail } from "@/server/trips/queries";
import { TripNewForm } from "../../new/trip-form";
import { updateTripAction } from "./actions";

export default async function TripEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [trip, user] = await Promise.all([getTripDetail(id), getCurrentUser()]);

  if (!trip) notFound();
  if (!user) redirect(`/auth/sign-in?callbackUrl=/trips/${id}/edit`);
  // Only the owner can edit, and only while the trip is still published.
  if (trip.driverId !== user.id) redirect(`/trips/${id}`);
  if (trip.status !== TripStatus.PUBLISHED) redirect(`/trips/${id}`);

  const primaryVehicle = user.vehicles[0];
  if (!primaryVehicle) redirect("/onboarding/driver");

  const c = ruContent.tripEdit;

  return (
    <main className="flex-1">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-8 sm:px-8">
        <div className="mb-6">
          <Link
            href={`/trips/${id}`}
            className="text-sm font-medium text-muted transition hover:text-accent"
          >
            ← {ruContent.trip.eyebrow}
          </Link>
        </div>

        <section className="rounded-[36px] border border-line bg-surface p-7 shadow-[0_24px_80px_rgba(23,33,43,0.08)] sm:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent-warm">
            {c.eyebrow}
          </p>
          <h1 className="mt-5 max-w-xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {c.title}
          </h1>
          <div className="mt-8">
            <TripNewForm
              maxSeats={primaryVehicle.seatsCount}
              vehicleName={`${primaryVehicle.make} ${primaryVehicle.model}`}
              action={updateTripAction}
              tripId={trip.id}
              submitLabel={c.submit}
              pendingLabel={c.pending}
              defaultValues={{
                pickupLabel: trip.pickupLabel,
                dropoffLabel: trip.dropoffLabel,
                pickupCoords:
                  trip.pickupLat != null && trip.pickupLng != null
                    ? { lat: trip.pickupLat, lng: trip.pickupLng }
                    : null,
                dropoffCoords:
                  trip.dropoffLat != null && trip.dropoffLng != null
                    ? { lat: trip.dropoffLat, lng: trip.dropoffLng }
                    : null,
                departureAt: formatBishkekDatetimeLocal(trip.departureAt),
                pricePerSeat: trip.pricePerSeat,
                totalSeats: trip.totalSeats,
                comment: trip.comment ?? undefined,
              }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
