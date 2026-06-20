import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { isDriverSetupComplete, isUserProfileComplete } from "@/server/users/profile";
import { DriverOnboardingForm } from "./driver-form";

export default async function DriverOnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/sign-in?callbackUrl=/onboarding/driver");
  }

  if (!isUserProfileComplete(user)) {
    redirect("/onboarding/profile");
  }

  const driverOnboarding = ruContent.driverOnboarding;
  const primaryVehicle = user.vehicles[0] ?? null;
  const isComplete = isDriverSetupComplete(user);

  return (
    <main className="flex-1">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-8 sm:px-8 lg:px-10">
        <section className="rounded-[36px] border border-line bg-surface p-7 shadow-[0_24px_80px_rgba(23,33,43,0.08)] sm:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent-warm">
            {driverOnboarding.eyebrow}
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {driverOnboarding.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-muted sm:text-lg">
            {driverOnboarding.description}
          </p>

          <div className="mt-6 rounded-4xl border border-line bg-white/70 px-5 py-4 text-sm leading-6 text-foreground">
            {isComplete
              ? driverOnboarding.completedNote
              : driverOnboarding.pendingNote}
          </div>

          <div className="mt-8 max-w-2xl rounded-4xl border border-line bg-white/80 p-6 sm:p-8">
            <DriverOnboardingForm
              isComplete={isComplete}
              defaultValues={{
                bio: user.driverProfile?.bio ?? "",
                make: primaryVehicle?.make ?? "",
                model: primaryVehicle?.model ?? "",
                color: primaryVehicle?.color ?? "",
                plateNumber: primaryVehicle?.plateNumber ?? "",
                seatsCount: primaryVehicle ? String(primaryVehicle.seatsCount) : "4",
              }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}