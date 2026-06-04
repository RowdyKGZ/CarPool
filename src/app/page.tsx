import { ruContent } from "@/lib/content/ru";

export default function Home() {
  const { home } = ruContent;

  return (
    <main className="flex-1">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent">
              {home.brand}
            </p>
            <p className="mt-2 text-sm text-muted">
              {home.note}
            </p>
          </div>
          <div className="rounded-full border border-line bg-surface px-4 py-2 text-sm text-muted shadow-[0_18px_60px_rgba(23,33,43,0.08)]">
            {home.statusBadge}
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_360px]">
          <div className="rounded-[36px] border border-line bg-surface p-7 shadow-[0_24px_80px_rgba(23,33,43,0.08)] sm:p-10">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent-warm">
              {home.eyebrow}
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {home.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              {home.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#roadmap"
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
              >
                {home.primaryCta}
              </a>
              <a
                href="#stack"
                className="rounded-full border border-line bg-white/70 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-strong"
              >
                {home.secondaryCta}
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {home.stats.map((stat) => (
                <div key={stat.label} className="rounded-3xl bg-white/70 p-5">
                  <p className="text-sm text-muted">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[36px] border border-line bg-surface-strong p-7 shadow-[0_24px_80px_rgba(23,33,43,0.08)] sm:p-8">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent">
              {home.principlesTitle}
            </p>
            <ul className="mt-6 space-y-4 text-sm leading-7 text-foreground sm:text-base">
              {home.principles.map((pillar) => (
                <li
                  key={pillar}
                  className="rounded-[22px] border border-line bg-white/80 px-4 py-4"
                >
                  {pillar}
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-4xl border border-line bg-surface p-7 shadow-[0_24px_80px_rgba(23,33,43,0.08)] sm:p-8">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent">
              {home.routesTitle}
            </p>
            <div className="mt-6 space-y-4">
              {home.launchRoutes.map((item) => (
                <article
                  key={item.route}
                  className="rounded-3xl border border-line bg-white/70 p-5"
                >
                  <h2 className="text-xl font-semibold text-foreground">
                    {item.route}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-muted sm:text-base">
                    {item.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div
            id="roadmap"
            className="rounded-4xl border border-line bg-foreground p-7 text-white shadow-[0_24px_80px_rgba(23,33,43,0.12)] sm:p-8"
          >
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-white/70">
              {home.roadmapTitle}
            </p>
            <div className="mt-6 grid gap-4">
              {home.phases.map((phase, index) => (
                <div
                  key={phase}
                  className="rounded-3xl border border-white/10 bg-white/6 p-5"
                >
                  <p className="text-sm text-white/60">
                    {home.phaseLabel} {index + 1}
                  </p>
                  <p className="mt-2 text-lg font-semibold leading-7">{phase}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="stack"
          className="mt-6 rounded-4xl border border-line bg-surface p-7 shadow-[0_24px_80px_rgba(23,33,43,0.08)] sm:p-8"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent-warm">
                {home.stackTitle}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {home.stackHeadline}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-muted sm:text-base">
              {home.stackDescription}
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {home.stack.map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-line bg-white/75 px-4 py-4 text-sm font-medium text-foreground"
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
