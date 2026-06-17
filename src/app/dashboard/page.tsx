import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { isDriverSetupComplete, isUserProfileComplete } from "@/lib/profile";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/sign-in?callbackUrl=/dashboard");
  }

  if (!isUserProfileComplete(user)) {
    redirect("/onboarding/profile");
  }

  const dashboard = ruContent.dashboard;
  const driverSetupComplete = isDriverSetupComplete(user);
  const primaryVehicle = user.vehicles[0] ?? null;
  const title = driverSetupComplete ? dashboard.readyTitle : dashboard.title;
  const description = driverSetupComplete
    ? dashboard.readyDescription
    : dashboard.description;

  return (
    <main className="flex-1">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <section className="rounded-[36px] border border-line bg-surface p-7 shadow-[0_24px_80px_rgba(23,33,43,0.08)] sm:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent-warm">
            {dashboard.eyebrow}
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-muted sm:text-lg">
            {description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {driverSetupComplete ? (
              <Link
                href="/trips/new"
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
              >
                {dashboard.createTrip}
              </Link>
            ) : null}
            <Link
              href="/onboarding/profile"
              className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
            >
              {dashboard.editProfile}
            </Link>
            <Link
              href="/onboarding/driver"
              className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
            >
              {driverSetupComplete ? dashboard.manageDriver : dashboard.setupDriver}
            </Link>
            <SignOutButton />
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <DashboardCard label={dashboard.cards.name} value={user.name} />
          <DashboardCard label={dashboard.cards.email} value={user.email ?? "-"} />
          <DashboardCard label={dashboard.cards.phone} value={user.phone ?? "-"} />
          <DashboardCard
            label={dashboard.cards.telegram}
            value={user.telegramUsername ? `@${user.telegramUsername}` : "-"}
          />
          <DashboardCard
            label={dashboard.cards.status}
            value={dashboard.cards.completed}
          />
          <DashboardCard
            label={dashboard.cards.driverStatus}
            value={
              driverSetupComplete
                ? dashboard.cards.driverCompleted
                : dashboard.cards.driverPending
            }
          />
          <DashboardCard
            label={dashboard.cards.vehicle}
            value={
              primaryVehicle
                ? `${primaryVehicle.make} ${primaryVehicle.model}, ${primaryVehicle.plateNumber}`
                : "-"
            }
          />
        </section>
      </div>
    </main>
  );
}

type DashboardCardProps = {
  label: string;
  value: string;
};

function DashboardCard({ label, value }: DashboardCardProps) {
  return (
    <article className="rounded-4xl border border-line bg-surface p-5 shadow-[0_18px_60px_rgba(23,33,43,0.06)]">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-3 text-lg font-semibold text-foreground">{value}</p>
    </article>
  );
}