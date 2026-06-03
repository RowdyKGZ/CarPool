const launchRoutes = [
  {
    route: "TSUM -> Archa-Beshik",
    detail: "Primary corridor for repeat morning and evening demand.",
  },
  {
    route: "TSUM -> Jal",
    detail: "High-density office commute with predictable departure windows.",
  },
  {
    route: "TSUM -> Asanbay",
    detail: "Pilot route for proving repeat riders and price tolerance.",
  },
];

const corePillars = [
  "Trips must be created in under two minutes from a phone browser.",
  "Booking flow stays human and predictable: request, confirm, contact share.",
  "The first release optimizes for liquidity and trust, not taxi-like complexity.",
];

const buildPhases = [
  "Auth, profile, vehicle setup",
  "Trip creation, listing, booking",
  "Notifications, reviews, admin tools",
];

const stack = [
  "Next.js 16",
  "TypeScript",
  "Prisma",
  "PostgreSQL",
  "Tailwind CSS",
  "Telegram notifications",
  "Mapbox",
  "Vercel + managed Postgres",
];

export default function Home() {
  return (
    <main className="flex-1">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-[color:var(--accent)]">
              CarPool
            </p>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              MVP scope is locked and the first product slice is now being built.
            </p>
          </div>
          <div className="rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--muted)] shadow-[0_18px_60px_rgba(23,33,43,0.08)]">
            Bishkek commute MVP
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_360px]">
          <div className="rounded-[36px] border border-[color:var(--line)] bg-[color:var(--surface)] p-7 shadow-[0_24px_80px_rgba(23,33,43,0.08)] sm:p-10">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-[color:var(--accent-warm)]">
              Shared rides for repeat routes
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-5xl lg:text-6xl">
              Turn empty seats into reliable commuter routes across Bishkek.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[color:var(--muted)] sm:text-xl">
              The first release focuses on one thing: drivers publish planned trips,
              passengers book seats, and both sides get a predictable confirmation
              flow without taxi-style overhead.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#roadmap"
                className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)]"
              >
                View build order
              </a>
              <a
                href="#stack"
                className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-strong)]"
              >
                Review stack
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] bg-white/70 p-5">
                <p className="text-sm text-[color:var(--muted)]">Launch scope</p>
                <p className="mt-2 text-2xl font-semibold">3 routes</p>
              </div>
              <div className="rounded-[24px] bg-white/70 p-5">
                <p className="text-sm text-[color:var(--muted)]">Core actions</p>
                <p className="mt-2 text-2xl font-semibold">Create, book, confirm</p>
              </div>
              <div className="rounded-[24px] bg-white/70 p-5">
                <p className="text-sm text-[color:var(--muted)]">MVP channels</p>
                <p className="mt-2 text-2xl font-semibold">Email + Telegram</p>
              </div>
            </div>
          </div>

          <aside className="rounded-[36px] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-7 shadow-[0_24px_80px_rgba(23,33,43,0.08)] sm:p-8">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-[color:var(--accent)]">
              Guardrails
            </p>
            <ul className="mt-6 space-y-4 text-sm leading-7 text-[color:var(--foreground)] sm:text-base">
              {corePillars.map((pillar) => (
                <li
                  key={pillar}
                  className="rounded-[22px] border border-[color:var(--line)] bg-white/80 px-4 py-4"
                >
                  {pillar}
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[32px] border border-[color:var(--line)] bg-[color:var(--surface)] p-7 shadow-[0_24px_80px_rgba(23,33,43,0.08)] sm:p-8">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-[color:var(--accent)]">
              Launch routes
            </p>
            <div className="mt-6 space-y-4">
              {launchRoutes.map((item) => (
                <article
                  key={item.route}
                  className="rounded-[24px] border border-[color:var(--line)] bg-white/70 p-5"
                >
                  <h2 className="text-xl font-semibold text-[color:var(--foreground)]">
                    {item.route}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--muted)] sm:text-base">
                    {item.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div
            id="roadmap"
            className="rounded-[32px] border border-[color:var(--line)] bg-[color:var(--foreground)] p-7 text-white shadow-[0_24px_80px_rgba(23,33,43,0.12)] sm:p-8"
          >
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-white/70">
              Build order
            </p>
            <div className="mt-6 grid gap-4">
              {buildPhases.map((phase, index) => (
                <div
                  key={phase}
                  className="rounded-[24px] border border-white/10 bg-white/6 p-5"
                >
                  <p className="text-sm text-white/60">Phase {index + 1}</p>
                  <p className="mt-2 text-lg font-semibold leading-7">{phase}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="stack"
          className="mt-6 rounded-[32px] border border-[color:var(--line)] bg-[color:var(--surface)] p-7 shadow-[0_24px_80px_rgba(23,33,43,0.08)] sm:p-8"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-[color:var(--accent-warm)]">
                Current stack
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-3xl">
                Next.js in the main app, Prisma for the domain layer, managed services around it.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
              The stack stays intentionally small until the product proves repeat
              usage on real corridors.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stack.map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-[color:var(--line)] bg-white/75 px-4 py-4 text-sm font-medium text-[color:var(--foreground)]"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
