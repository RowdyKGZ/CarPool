import Link from "next/link";
import { TripStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { ruContent } from "@/lib/content/ru";

const BISHKEK_OFFSET_MS = 6 * 60 * 60 * 1000;

function bishkekDayBounds(offsetDays: number): { gte: Date; lt: Date } {
  const now = new Date();
  const bishkekNow = new Date(now.getTime() + BISHKEK_OFFSET_MS);
  const y = bishkekNow.getUTCFullYear();
  const m = bishkekNow.getUTCMonth();
  const d = bishkekNow.getUTCDate();
  return {
    gte: new Date(Date.UTC(y, m, d + offsetDays) - BISHKEK_OFFSET_MS),
    lt: new Date(Date.UTC(y, m, d + offsetDays + 1) - BISHKEK_OFFSET_MS),
  };
}

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

type DateFilter = "today" | "tomorrow" | "all";

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const filter: DateFilter =
    date === "tomorrow" ? "tomorrow" : date === "all" ? "all" : "today";

  const now = new Date();
  const todayBounds = bishkekDayBounds(0);
  const tomorrowBounds = bishkekDayBounds(1);

  const dateWhere =
    filter === "today"
      ? { gte: now > todayBounds.gte ? now : todayBounds.gte, lt: todayBounds.lt }
      : filter === "tomorrow"
        ? tomorrowBounds
        : { gte: now };

  const trips = await db.trip.findMany({
    where: {
      status: TripStatus.PUBLISHED,
      departureAt: dateWhere,
    },
    select: {
      id: true,
      pickupLabel: true,
      dropoffLabel: true,
      departureAt: true,
      pricePerSeat: true,
      availableSeats: true,
      totalSeats: true,
      driver: { select: { name: true } },
      vehicle: { select: { make: true, model: true, color: true } },
    },
    orderBy: { departureAt: "asc" },
  });

  const c = ruContent.tripsList;

  const tabs: { label: string; value: DateFilter; href: string }[] = [
    { label: c.filterToday, value: "today", href: "/trips" },
    { label: c.filterTomorrow, value: "tomorrow", href: "/trips?date=tomorrow" },
    { label: c.filterAll, value: "all", href: "/trips?date=all" },
  ];

  return (
    <main className="flex-1">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-8 sm:px-8">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent-warm">
            {c.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {c.title}
          </h1>
          <p className="mt-2 text-base text-muted">{c.description}</p>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={tab.href}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
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
              {c.createTripCta}
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
                        <p className="text-base font-semibold text-foreground">
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
                            {c.seats}: {trip.availableSeats} / {trip.totalSeats}
                          </span>
                          <span className="text-muted/60 select-none">·</span>
                          <span className="text-muted">{trip.driver.name}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          {trip.vehicle.make} {trip.vehicle.model} · {trip.vehicle.color}
                        </p>
                      </div>
                      <span className="mt-0.5 shrink-0 rounded-full border border-accent px-3 py-1 text-xs font-semibold text-accent">
                        {c.openTrip} →
                      </span>
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
