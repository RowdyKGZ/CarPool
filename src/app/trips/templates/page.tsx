import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { formatDeparture } from "@/lib/datetime";
import { listDriverActiveTrips } from "@/server/trips/queries";
import { listDriverTemplates } from "@/server/trip-templates/queries";
import { SubmitButton } from "@/components/submit-button";
import {
  createFromTripAction,
  deleteTemplateAction,
  reverseTemplateAction,
} from "./template-actions";

export default async function TripTemplatesPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/trips/templates");
  }

  const [templates, activeTrips] = await Promise.all([
    listDriverTemplates(session.user.id),
    listDriverActiveTrips(session.user.id),
  ]);
  const c = ruContent.tripTemplates;

  return (
    <main className="flex-1">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-8 sm:px-8">
        <div className="mb-6">
          <Link
            href="/my-trips"
            className="text-sm font-medium text-muted transition hover:text-accent"
          >
            ← {c.back}
          </Link>
        </div>

        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent-warm">
              {c.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {c.title}
            </h1>
            <p className="mt-2 text-base text-muted">{c.description}</p>
          </div>
        </div>

        <Link
          href="/trips/templates/new"
          className="mb-6 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong"
        >
          + {c.create}
        </Link>

        {activeTrips.length > 0 ? (
          <form
            action={createFromTripAction}
            className="mb-6 rounded-3xl border border-line bg-surface p-5"
          >
            <p className="font-semibold text-foreground">{c.fromTripTitle}</p>
            <p className="mt-1 text-sm text-muted">{c.fromTripHint}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <select
                name="tripId"
                defaultValue=""
                required
                className="w-full rounded-3xl border border-line bg-white px-4 py-3 text-base text-foreground outline-none transition focus:border-accent"
              >
                <option value="" disabled>
                  {c.fromTripPlaceholder}
                </option>
                {activeTrips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.pickupLabel} → {trip.dropoffLabel} ·{" "}
                    {formatDeparture(trip.departureAt)}
                  </option>
                ))}
              </select>
              <SubmitButton className="shrink-0 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-70">
                {c.fromTripButton}
              </SubmitButton>
            </div>
          </form>
        ) : null}

        {templates.length === 0 ? (
          <div className="rounded-3xl border border-line bg-surface p-10 text-center">
            <p className="text-muted">{c.empty}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {templates.map((template) => (
              <li key={template.id}>
                <article className="rounded-3xl border border-line bg-surface p-5 shadow-[0_8px_32px_rgba(23,33,43,0.06)]">
                  <p className="font-semibold text-foreground">
                    {template.title ?? (
                      <>
                        {template.pickupLabel}
                        <span className="mx-2 font-normal text-muted">→</span>
                        {template.dropoffLabel}
                      </>
                    )}
                  </p>
                  {template.title ? (
                    <p className="mt-1 text-sm text-muted">
                      {template.pickupLabel} → {template.dropoffLabel}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="text-muted">
                      {template.departureTime
                        ? `${c.timePrefix} ${template.departureTime}`
                        : c.noTime}
                    </span>
                    <span className="text-muted/60 select-none">·</span>
                    <span className="font-semibold text-accent">
                      {template.pricePerSeat} {c.currency}
                    </span>
                    <span className="text-muted/60 select-none">·</span>
                    <span className="text-muted">
                      {template.totalSeats} {c.seats}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/trips/new?template=${template.id}`}
                      className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong"
                    >
                      {c.launch} →
                    </Link>
                    <Link
                      href={`/trips/templates/${template.id}/edit`}
                      className="rounded-full border border-line px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
                    >
                      {c.edit}
                    </Link>
                    <form action={reverseTemplateAction}>
                      <input type="hidden" name="templateId" value={template.id} />
                      <SubmitButton className="rounded-full border border-line px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent disabled:opacity-70">
                        ⇄ {c.reverse}
                      </SubmitButton>
                    </form>
                    <form action={deleteTemplateAction} className="ml-auto">
                      <input type="hidden" name="templateId" value={template.id} />
                      <SubmitButton className="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:text-[rgb(185,28,28)] disabled:opacity-70">
                        {c.delete}
                      </SubmitButton>
                    </form>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
