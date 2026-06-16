# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

CarPool is a mobile-first MVP for a carpooling service covering repeating daily routes in Bishkek (driver publishes a trip, passenger books a seat, driver confirms/rejects, both get notified, both can review after completion). Full product spec lives in [docs/mvp.md](docs/mvp.md); keep changes aligned with its "Рабочие правила" (mobile-first, ship speed over architectural complexity, one Next.js app, manual moderation over premature automation) and its explicit out-of-scope list (no native apps, no online payments, no live tracking, no complex route-geometry matching, no chat, no company accounts, no microservices, no referral/loyalty system).

**Product language rule:** all user-facing UI text, statuses, errors, and email/Telegram notification copy must be in Russian. Code, Prisma models, entity names, and technical identifiers stay in English. UI copy is centralized in [src/lib/content/ru.ts](src/lib/content/ru.ts) (`ruContent`) — new UI text should be added there, not inlined in components.

## Commands

```bash
npm run dev              # start dev server (Next.js, Turbopack)
npm run build             # production build
npm run lint              # ESLint (eslint-config-next core-web-vitals + typescript)
npx tsc --noEmit           # type-check only (no dedicated package.json script exists for this)

npm run prisma:generate   # regenerate Prisma client after schema changes
npm run db:push           # push prisma/schema.prisma to the database (no migrations dir is used)
npm run db:studio         # open Prisma Studio

npm run docker:up         # full local stack (app + postgres) via docker-compose
npm run docker:db         # postgres only, for local `npm run dev` + Prisma/DBeaver
npm run docker:down
npm run docker:logs
```

There is no test framework configured yet (no jest/vitest/playwright, no `*.test.*` files, no test script) — don't assume one exists.

Local setup: copy `.env.example` to `.env`, set `DATABASE_URL`/`NEXTAUTH_URL`/`NEXTAUTH_SECRET`, `npm install`, `npm run prisma:generate`, `npm run dev`.

## Architecture

### Feature folder convention (App Router + Server Actions)

Each onboarding-style feature under `src/app/**` follows the same 4-file split — follow it for new features (e.g. trip creation, booking):

- `page.tsx` — server component. Loads the current user via `getCurrentUser()`, enforces auth/flow gating with `redirect(...)`, passes plain-data `defaultValues` into the client form.
- `actions.ts` — `"use server"`. Exports **only** the async server action(s). Validates `FormData` with a local `zod` schema, returns a state object on validation/conflict errors, calls `redirect(...)` on success.
- `state.ts` — plain module (no directive). Holds the action's state `type` and its `initial*State` constant.
- `*-form.tsx` — `"use client"`. Calls `useActionState(serverAction, initialState)` from `./state` + `./actions`, renders `state.fieldErrors.<field>`, uses `useFormStatus()` for the submit button's pending state.

See [src/app/onboarding/profile/](src/app/onboarding/profile/) and [src/app/onboarding/driver/](src/app/onboarding/driver/) for the reference implementation.

**Hard rule: never export non-function bindings (consts, types) from a `"use server"` file.** Next.js only keeps async-function exports when it builds the client-side action reference for such a module; a plain object/type export silently becomes `undefined` in the client bundle. This exact mistake (initial state constants declared in `actions.ts` instead of `state.ts`) has broken `state.fieldErrors.*` at runtime twice already in this repo — keep state/types in `state.ts`, never in `actions.ts`.

### Auth & onboarding gating

Auth is intentionally minimalist for this stage (see docs/mvp.md "Аутентификация"): `next-auth` Credentials provider keyed only by email (+ optional name), JWT session strategy, no password/magic-link/OAuth yet — that's the production target, not what's implemented. Everything funnels through [src/lib/auth.ts](src/lib/auth.ts):

- `getAuthSession()` / `getCurrentUser()` — current user with `driverProfile` + first `vehicle` preloaded.
- `getPostAuthRedirect(user)` — single source of truth for "where does this user land", based on `isUserProfileComplete`.
- Session/JWT are augmented with `user.id` via the callbacks in `authOptions`; the `id` field is typed on in [src/types/next-auth.d.ts](src/types/next-auth.d.ts).

Profile/driver completeness predicates live in [src/lib/profile.ts](src/lib/profile.ts) (`isUserProfileComplete`, `isDriverSetupComplete`) and are re-checked independently on every page (`/`, `/auth/sign-in`, `/dashboard`, `/onboarding/profile`, `/onboarding/driver`) rather than cached — the funnel is sign-in → `/onboarding/profile` (phone + telegramUsername) → `/onboarding/driver` (bio + vehicle) → `/dashboard`, but a returning user with a complete profile is sent straight to `/dashboard` from any entry point. `lib/profile.ts` also has the input-normalizers (`normalizePhone`, `normalizeTelegramUsername`, `normalizeVehiclePlate`) shared between zod schemas in different `actions.ts` files.

### Server action error pattern

Server actions catch `Prisma.PrismaClientKnownRequestError` with code `P2002` (unique constraint) and map `error.meta.target` back to the specific form field (e.g. `phone`, `telegramUsername`, `plateNumber`) so the UI can show a field-level error instead of a generic failure. Follow this pattern for new unique fields (e.g. future `Trip`/`Booking` constraints) rather than letting the constraint error bubble up.

### Data layer

[src/lib/db.ts](src/lib/db.ts) exports a singleton `PrismaClient` cached on `globalThis` in non-production to survive dev hot-reload. Always import `db` from there; never instantiate `PrismaClient` directly.

[prisma/schema.prisma](prisma/schema.prisma) is the full intended domain model (`User`, `DriverProfile`, `Vehicle`, `Trip`, `Booking`, `Review`, `Notification`, `Report`, `AdminNote`) even though app code currently only touches `User`/`DriverProfile`/`Vehicle` — `Trip`/`Booking`/`Review`/`Notification`/`Report`/`AdminNote` are modeled ahead of the UI that will use them (see docs/mvp.md stage 2/3 roadmap). There's no `prisma/migrations` directory; schema changes are applied with `db:push`, not `migrate`.

### Styling

Tailwind v4 with the `@theme inline` block in [src/app/globals.css](src/app/globals.css) mapping custom color tokens (`background`, `foreground`, `surface`, `surface-strong`, `muted`, `line`, `accent`, `accent-strong`, `accent-warm`) to CSS variables in `:root`. Use these tokens (`bg-surface`, `text-muted`, `border-line`, `text-accent`, etc.) instead of raw Tailwind palette colors to stay visually consistent with existing pages.
