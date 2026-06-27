import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { nextBishkekOccurrenceLocal } from "@/lib/datetime";
import { isDriverSetupComplete, isUserProfileComplete } from "@/server/users/profile";
import { getTemplateForDriver } from "@/server/trip-templates/queries";
import { TripNewForm, type TripFormDefaults } from "./trip-form";

export default async function TripNewPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/sign-in?callbackUrl=/trips/new");
  }

  if (!isUserProfileComplete(user)) {
    redirect("/onboarding/profile");
  }

  if (!isDriverSetupComplete(user)) {
    redirect("/onboarding/driver");
  }

  const primaryVehicle = user.vehicles[0]!;
  const vehicleName = `${primaryVehicle.make} ${primaryVehicle.model}`;
  const c = ruContent.tripNew;

  // Launching a template prefills the form with its saved route + a date set to
  // the next occurrence of the template's time.
  const { template: templateId } = await searchParams;
  let defaultValues: TripFormDefaults | undefined;
  if (templateId) {
    const template = await getTemplateForDriver(user.id, templateId);
    if (template) {
      defaultValues = {
        pickupLabel: template.pickupLabel,
        dropoffLabel: template.dropoffLabel,
        pickupCoords:
          template.pickupLat != null && template.pickupLng != null
            ? { lat: template.pickupLat, lng: template.pickupLng }
            : null,
        dropoffCoords:
          template.dropoffLat != null && template.dropoffLng != null
            ? { lat: template.dropoffLat, lng: template.dropoffLng }
            : null,
        departureAt: nextBishkekOccurrenceLocal(template.departureTime),
        pricePerSeat: template.pricePerSeat,
        totalSeats: template.totalSeats,
        comment: template.comment ?? undefined,
      };
    }
  }

  return (
    <main className="flex-1">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-8 sm:px-8">
        <section className="rounded-[36px] border border-line bg-surface p-7 shadow-[0_24px_80px_rgba(23,33,43,0.08)] sm:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent-warm">
            {c.eyebrow}
          </p>
          <h1 className="mt-5 max-w-xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {c.title}
          </h1>
          <p className="mt-4 text-base leading-7 text-muted">{c.description}</p>
          <div className="mt-8">
            <TripNewForm
              maxSeats={primaryVehicle.seatsCount}
              vehicleName={vehicleName}
              defaultValues={defaultValues}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
