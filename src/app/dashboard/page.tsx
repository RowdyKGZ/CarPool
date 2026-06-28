import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { isDriverSetupComplete, isUserProfileComplete } from "@/server/users/profile";
import { connectTelegramAction } from "./actions";

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
  const telegramLinked = Boolean(user.telegramChatId);
  const telegramConfigured = Boolean(process.env.TELEGRAM_BOT_USERNAME);
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
            <Link
              href="/trips"
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
            >
              {dashboard.browseTrips}
            </Link>
            <Link
              href="/my-bookings"
              className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
            >
              {dashboard.myBookings}
            </Link>
            {driverSetupComplete ? (
              <>
                <Link
                  href="/my-trips"
                  className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
                >
                  {dashboard.myTrips}
                </Link>
                <Link
                  href="/trips/new"
                  className="rounded-full border border-accent px-5 py-3 text-sm font-semibold text-accent transition hover:bg-accent hover:text-white"
                >
                  {dashboard.createTrip}
                </Link>
              </>
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
            {/* Telegram OTP sign-in already captures telegramChatId, so only users
                who aren't linked yet (e.g. Google sign-in) need the connect step. */}
            {telegramConfigured && !telegramLinked && (
              <form action={connectTelegramAction}>
                <button
                  type="submit"
                  className="rounded-full border border-accent px-5 py-3 text-sm font-semibold text-accent transition hover:bg-accent hover:text-white"
                >
                  {dashboard.connectTelegram}
                </button>
              </form>
            )}
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
          <DashboardCard
            label={dashboard.cards.telegramNotifications}
            value={
              telegramLinked
                ? dashboard.cards.telegramConnected
                : dashboard.cards.telegramDisconnected
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