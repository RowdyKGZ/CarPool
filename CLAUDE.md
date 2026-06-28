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
npm test                  # run Vitest once (alias: vitest run)
npm run test:watch        # Vitest in watch mode

npm run prisma:generate   # regenerate Prisma client after schema changes
npm run db:push           # push prisma/schema.prisma to the database (no migrations dir is used)
npm run db:studio         # open Prisma Studio

npm run docker:up         # full local stack (app + postgres) via docker-compose
npm run docker:db         # postgres only, for local `npm run dev` + Prisma/DBeaver
npm run docker:down
npm run docker:logs
```

Tests run on **Vitest** (`npm test`). Tests live next to the code as `*.test.ts` (config in [vitest.config.ts](vitest.config.ts), `@` alias → `src`, node environment). The pattern for DB-touching domain logic is to mock the Prisma singleton with `vi.mock("@/lib/db", ...)` (use `vi.hoisted` for the mock object) rather than hitting a real database — see [src/server/telegram/otp.test.ts](src/server/telegram/otp.test.ts) and [src/server/bookings/mutations.test.ts](src/server/bookings/mutations.test.ts). Pure helpers/schemas are tested directly (e.g. [src/lib/datetime.test.ts](src/lib/datetime.test.ts)). No Playwright/e2e layer exists.

Local setup: copy `.env.example` to `.env`, set `DATABASE_URL`/`NEXTAUTH_URL`/`NEXTAUTH_SECRET`, `npm install`, `npm run prisma:generate`, `npm run dev`.

## Architecture

### Feature folder convention (App Router + Server Actions)

Each onboarding-style feature under `src/app/**` follows the same 4-file split — follow it for new features (e.g. trip creation, booking):

- `page.tsx` — server component. Loads the current user via `getCurrentUser()`, enforces auth/flow gating with `redirect(...)`, passes plain-data `defaultValues` into the client form.
- `actions.ts` — `"use server"`. Exports **only** the async server action(s). Stays thin: reads `FormData`, validates with the domain `zod` schema from `src/server/<domain>/schema.ts`, delegates persistence/business rules to a `src/server/<domain>/mutations.ts` function, maps the returned result to a state object on validation/conflict errors, calls `redirect(...)` on success. No Prisma access directly in `actions.ts`.
- `state.ts` — plain module (no directive). Holds the action's state `type` and its `initial*State` constant.
- `*-form.tsx` — `"use client"`. Calls `useActionState(serverAction, initialState)` from `./state` + `./actions`, renders `state.fieldErrors.<field>`, uses `useFormStatus()` for the submit button's pending state.

See [src/app/onboarding/profile/](src/app/onboarding/profile/) and [src/app/onboarding/driver/](src/app/onboarding/driver/) for the reference implementation.

**Hard rule: never export non-function bindings (consts, types) from a `"use server"` file.** Next.js only keeps async-function exports when it builds the client-side action reference for such a module; a plain object/type export silently becomes `undefined` in the client bundle. This exact mistake (initial state constants declared in `actions.ts` instead of `state.ts`) has broken `state.fieldErrors.*` at runtime twice already in this repo — keep state/types in `state.ts`, never in `actions.ts`.

### Domain layer (`src/server/<domain>/`)

Business logic and DB access live in domain modules under `src/server/`, **not** in `app/`. The `app/` layer (pages + actions) is routing/UI only and never touches Prisma directly — `page.tsx` calls queries, `actions.ts` calls mutations. Each domain (`users`, `trips`, `bookings`; add `reviews`/`notifications`/`reports`/`admin` the same way as their UI lands) follows a 3-file split:

- `queries.ts` — read functions returning Prisma data (e.g. `listPublishedTrips`, `getTripDetail`, `listPassengerBookings`). Reusable across pages so the same query isn't re-inlined per route.
- `mutations.ts` — writes/transactions. Return a **discriminated result** (`{ ok: true, ... } | { ok: false, reason | conflict }`) for domain conflicts instead of throwing string errors; the calling action maps the result to Russian copy from `ruContent`. These are plain modules (no `"use server"`), called from server components/actions only — never import them into client components.
- `schema.ts` — `zod` schemas + their inferred input types + any `FormData` readers for the domain. Plain module, so it may export consts/types freely (unlike `actions.ts`).

`src/server/users/profile.ts` holds cross-cutting user predicates (`isUserProfileComplete`, `isDriverSetupComplete`) and input normalizers (`normalizePhone`, `normalizeTelegramUsername`, `normalizeVehiclePlate`, `buildDisplayName`) shared between domain schemas and auth.

`src/lib/` is reserved for infrastructure with **no domain** (`db`, `auth`, `content/ru.ts`, `datetime`, `districts`). Shared date/time helpers (`formatDeparture`, `bishkekDayBounds`, `parseBishkekDatetime` — Bishkek is UTC+6, times stored in UTC) live in [src/lib/datetime.ts](src/lib/datetime.ts); don't re-inline them per page.

See [src/server/bookings/](src/server/bookings/) for the reference implementation (schema + queries + result-returning mutations) and [src/app/trips/[id]/booking-actions.ts](src/app/trips/%5Bid%5D/booking-actions.ts) for the matching thin action.

### Auth & onboarding gating

Auth uses `next-auth` with a JWT session strategy (90-day `maxAge`) and three providers, all funneling through [src/lib/auth.ts](src/lib/auth.ts): **Google** OAuth (prod), **Telegram OTP** (`telegram-otp` Credentials provider — bot deep-link + 6-digit code, see Telegram section below), and a **dev email** Credentials provider (`devLoginEnabled`, non-production only; seeds a throwaway phone so onboarding is skipped). Each provider is gated on its config (`googleConfigured`/`telegramConfigured`/`devLoginEnabled`). The `jwt` callback resolves every provider onto a single `User` row: email providers find-or-create by email; Telegram returns our `User.id` directly (it's resolved + status-checked inside `verifyTelegramOtp`, identity keyed on `User.telegramUserId`). Key helpers:

- `getAuthSession()` / `getCurrentUser()` — current user with `driverProfile` + first `vehicle` preloaded.
- `getPostAuthRedirect(user)` — single source of truth for "where does this user land", based on `isUserProfileComplete`.
- Session/JWT are augmented with `user.id` via the callbacks in `authOptions`; the `id` field is typed on in [src/types/next-auth.d.ts](src/types/next-auth.d.ts).

Profile/driver completeness predicates live in [src/server/users/profile.ts](src/server/users/profile.ts) (`isUserProfileComplete`, `isDriverSetupComplete`) and are re-checked independently on every page (`/`, `/auth/sign-in`, `/dashboard`, `/onboarding/profile`, `/onboarding/driver`) rather than cached — the funnel is sign-in → `/onboarding/profile` (phone required; telegramUsername optional and auto-filled from Telegram on OTP sign-in) → `/onboarding/driver` (bio + vehicle) → `/dashboard`, but a returning user with a complete profile is sent straight to `/dashboard` from any entry point. **`isUserProfileComplete` requires `phone` only.** `server/users/profile.ts` also holds the input-normalizers (`normalizePhone`, `normalizeTelegramUsername`, `normalizeVehiclePlate`) used by the domain zod schemas in `src/server/users/schema.ts`.

### Telegram integration

The bot ([@CarPoolRegisterBot](https://t.me/CarPoolRegisterBot)) drives both login and notifications. Updates arrive at [src/app/api/telegram/webhook/route.ts](src/app/api/telegram/webhook/route.ts), authenticated by the `x-telegram-bot-api-secret-token` header matching `TELEGRAM_WEBHOOK_SECRET` (register the webhook once via the Bot API `setWebhook`). It dispatches `/start <param>` two ways: a param prefixed `tg_` is an **OTP login** nonce (→ `deliverTelegramOtp` returns a 6-digit code the bot sends back); any other param is a **notification-linking** token (→ `linkTelegramChat` binds `telegramChatId`). Both live in [src/server/telegram/](src/server/telegram/) — `otp.ts` (login flow) and `mutations.ts` (linking). The OTP flow is backed by the `TelegramAuthChallenge` model with a 10-min TTL, a per-challenge attempt cap, a per-account delivery rate-limit, and opportunistic cleanup of expired/consumed rows on each new login. Outbound messages go through `sendTelegramMessage` in [src/lib/notify.ts](src/lib/notify.ts); note the bot can only message a user **after** they've `/start`ed it (that's when `telegramChatId` is captured). Env: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` (no `@`), `TELEGRAM_WEBHOOK_SECRET`.

### Server action error pattern

Unique-constraint handling lives in the **mutation** (`src/server/<domain>/mutations.ts`), not the action: the mutation catches `Prisma.PrismaClientKnownRequestError` with code `P2002` and maps `error.meta.target` to a `conflict` field (e.g. `phone`, `telegramUsername`, `plateNumber`), returning `{ ok: false, conflict }`. The action then maps that conflict to a field-level Russian error from `ruContent` instead of letting the constraint error bubble up (see `conflictField` in [src/server/users/mutations.ts](src/server/users/mutations.ts)). Follow this pattern for new unique fields rather than throwing.

### Data layer

[src/lib/db.ts](src/lib/db.ts) exports a singleton `PrismaClient` cached on `globalThis` in non-production to survive dev hot-reload. Always import `db` from there; never instantiate `PrismaClient` directly.

[prisma/schema.prisma](prisma/schema.prisma) is the full domain model (`User`, `DriverProfile`, `Vehicle`, `Trip`, `TripTemplate`, `Booking`, `Review`, `Notification`, `Report`, `AdminNote`, `TelegramAuthChallenge`). All are now used by the `src/server/` domain layer except `AdminNote` (modeled ahead of its UI). There's no `prisma/migrations` directory; schema changes are applied with `db:push`, not `migrate`.

**Production DB is Supabase Postgres.** On Vercel (serverless) `DATABASE_URL` must use the **Transaction pooler** (`...pooler.supabase.com:6543/...?pgbouncer=true&connection_limit=1`), not session mode (`:5432`) — session mode throws `prepared statement "sN" does not exist` under serverless. After editing `schema.prisma` and running `prisma generate`/`db:push`, **restart any running `npm run dev`** — the Prisma client is cached in the process and won't pick up new models otherwise.

### Styling

Tailwind v4 with the `@theme inline` block in [src/app/globals.css](src/app/globals.css) mapping custom color tokens (`background`, `foreground`, `surface`, `surface-strong`, `muted`, `line`, `accent`, `accent-strong`, `accent-warm`) to CSS variables in `:root`. Use these tokens (`bg-surface`, `text-muted`, `border-line`, `text-accent`, etc.) instead of raw Tailwind palette colors to stay visually consistent with existing pages.
