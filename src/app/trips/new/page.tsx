import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { isDriverSetupComplete, isUserProfileComplete } from "@/server/users/profile";
import { TripNewForm } from "./trip-form";

export default async function TripNewPage() {
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
            />
          </div>
        </section>
      </div>
    </main>
  );
}
