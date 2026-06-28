import Link from "next/link";
import { ruContent } from "@/lib/content/ru";
import { formatDeparture } from "@/lib/datetime";
import { listPublishedTrips, type TripsDateFilter } from "@/server/trips/queries";
import { DistrictFilter } from "./district-filter";

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; from?: string; to?: string; page?: string }>;
}) {
  const { date, from, to, page: pageParam } = await searchParams;
  const filter: TripsDateFilter =
    date === "tomorrow" ? "tomorrow" : date === "all" ? "all" : "today";
  const requestedPage = Math.max(1, Number(pageParam) || 1);

  const { trips, page, hasMore } = await listPublishedTrips(filter, {
    from: from ?? null,
    to: to ?? null,
    page: requestedPage,
  });

  const c = ruContent.tripsList;

  // Keeps the active district filter when switching the date tab.
  const tabHref = (value: TripsDateFilter) => {
    const params = new URLSearchParams();
    if (value !== "today") params.set("date", value);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    return qs ? `/trips?${qs}` : "/trips";
  };

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/trips?${qs}` : "/trips";
  };

  const tabs: { label: string; value: TripsDateFilter; href: string }[] = [
    { label: c.filterToday, value: "today", href: tabHref("today") },
    { label: c.filterTomorrow, value: "tomorrow", href: tabHref("tomorrow") },
    { label: c.filterAll, value: "all", href: tabHref("all") },
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

        <DistrictFilter from={from ?? ""} to={to ?? ""} />

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

        {(page > 1 || hasMore) && (
          <div className="mt-6 flex items-center justify-between gap-3">
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                className="rounded-full border border-line px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
              >
                ← {c.prevPage}
              </Link>
            ) : (
              <span />
            )}
            {hasMore ? (
              <Link
                href={pageHref(page + 1)}
                className="rounded-full border border-line px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
              >
                {c.nextPage} →
              </Link>
            ) : (
              <span />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
