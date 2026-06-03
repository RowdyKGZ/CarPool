# CarPool

CarPool is a mobile-first ride sharing MVP focused on repeat commuter routes in Bishkek.

The current product scope is locked in [docs/mvp.md](docs/mvp.md).

## MVP scope

- drivers create planned trips
- passengers browse and book available seats
- drivers confirm or reject bookings
- users receive notifications by email and Telegram
- both sides can leave reviews after completed trips

The first release does not include online payments, live tracking, native mobile apps, or advanced route matching.

## Stack

- Next.js 16 with App Router and TypeScript
- Prisma ORM
- PostgreSQL
- Tailwind CSS
- Mapbox for trip points
- Telegram Bot API and email for notifications
- Vercel and managed Postgres for deployment

## Local setup

1. Copy `.env.example` to `.env`.
2. Set a valid `DATABASE_URL`.
3. Install dependencies with `npm install`.
4. Generate Prisma client with `npm run prisma:generate`.
5. Start the app with `npm run dev`.

## Docker setup

Run the full local stack with Docker:

```bash
npm run docker:up
```

If you only need PostgreSQL for Prisma or DBeaver:

```bash
npm run docker:db
```

This starts:

- Next.js app at `http://localhost:3000`
- PostgreSQL at `localhost:5432`

Useful commands:

- `npm run docker:logs` to follow container logs
- `npm run docker:down` to stop the stack

On the first `npm run docker:up`, the `app` container installs npm dependencies inside its Docker volume before starting Next.js, so the first startup can take a bit longer than the next ones.

The PostgreSQL container uses these default credentials:

- host: `localhost`
- port: `5432`
- database: `carpool`
- user: `postgres`
- password: `postgres`

You can use the same values in DBeaver.

## Scripts

- `npm run dev` starts the development server.
- `npm run lint` runs ESLint.
- `npm run prisma:generate` regenerates the Prisma client.
- `npm run db:push` pushes the Prisma schema to the database.
- `npm run db:studio` opens Prisma Studio.

## Near-term build order

1. Auth, profile, and vehicle setup
2. Trip creation, listing, and booking
3. Notifications, reviews, and admin tools
