# CarPool MVP

## Product Goal

CarPool is a mobile-first web MVP for ride sharing inside Bishkek.

Primary scenario:

1. A driver creates a trip.
2. A passenger finds a trip.
3. A passenger books a seat.
4. The driver confirms or rejects the booking.
5. Both sides receive contact details and notifications.
6. After the trip both sides can leave a review.

The MVP is focused on validating repeatable demand on a small set of routes, not on building a full taxi-like platform.

## Launch Scope

### Initial City and Routes

Launch only in Bishkek and start with 2-3 high-frequency directions:

- TSUM -> Archa-Beshik
- TSUM -> Jal
- TSUM -> Asanbay

### Target Users

- office workers commuting on a regular schedule
- students with repeated daily routes
- drivers who already travel and want to offset fuel costs

### Roles

- passenger
- driver
- admin

A single user can act as both passenger and driver.

## MVP Features

### Included in Version 1

- sign up and sign in
- user profile
- driver vehicle profile
- create trip
- browse and filter trips
- trip details page
- book seats
- accept or reject booking by driver
- cancel booking
- cancel trip
- my trips and my bookings pages
- trip completion flow
- ratings and reviews after completed trips
- basic admin panel for moderation
- email and Telegram notifications

### Explicitly Out of Scope

- native mobile applications
- online payments
- live tracking like taxi apps
- advanced route matching by geometry
- in-app chat
- company dashboards
- dynamic pricing
- microservices
- loyalty or referral system

## User Flows

### Driver Flow

1. Sign in.
2. Complete profile.
3. Add vehicle.
4. Create trip with route, departure time, price, seats, and comment.
5. Receive booking requests.
6. Confirm or reject each booking.
7. Share contact details after confirmation.
8. Mark trip as completed.
9. Leave review for passengers if needed.

### Passenger Flow

1. Sign in.
2. Complete profile.
3. Browse trips.
4. Filter by route, date, and time.
5. Open trip details.
6. Book one or more seats.
7. Receive confirmation or rejection.
8. Contact driver after confirmation.
9. Mark trip as completed.
10. Leave review.

### Admin Flow

1. Review users, trips, reports, and suspicious activity.
2. Suspend abusive users.
3. Hide invalid trips.
4. Resolve support incidents manually.

## Core Domain Entities

- User
- DriverProfile
- Vehicle
- Trip
- Booking
- Review
- Notification
- Report
- AdminNote

## Draft Data Model

### User

- id
- name
- email
- phone
- telegramUsername
- avatarUrl
- role flags
- isVerified
- status
- createdAt
- updatedAt

### DriverProfile

- id
- userId
- bio
- licenseVerified
- averageRating
- tripsCompleted

### Vehicle

- id
- userId
- make
- model
- color
- plateNumber
- seatsCount
- photoUrl

### Trip

- id
- driverId
- vehicleId
- fromDistrict
- toDistrict
- pickupLabel
- pickupLat
- pickupLng
- dropoffLabel
- dropoffLat
- dropoffLng
- departureAt
- pricePerSeat
- totalSeats
- availableSeats
- comment
- status
- createdAt
- updatedAt

### Booking

- id
- tripId
- passengerId
- seatsRequested
- status
- note
- confirmedAt
- cancelledAt
- contactSharedAt
- createdAt
- updatedAt

### Review

- id
- tripId
- authorId
- targetUserId
- rating
- comment
- createdAt

## Technology Decisions

### Application Stack

- Next.js 16
- TypeScript
- App Router
- React Server Components where practical
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod

### Backend and Database

- Next.js Route Handlers and Server Actions for MVP backend logic
- Prisma as ORM
- PostgreSQL as primary database

### Authentication

Preferred MVP auth:

- Google sign-in
- email magic link

Phone auth is postponed because it adds cost and operational overhead.

### Notifications

MVP notifications:

- email for sign-in and transaction events
- Telegram bot for booking, confirmation, cancellation, and reminder notifications

Postpone SMS and push notifications until there is proven demand.

### Maps

MVP map choice:

- Mapbox for place picking and trip point display

Map is used only for pickup and dropoff points.
No live location tracking in version 1.

## Infrastructure Plan

### Hosting

- Vercel for the Next.js application
- Supabase Postgres or Neon for PostgreSQL
- Supabase Storage or S3-compatible storage for images
- Resend for email delivery
- Telegram Bot API for operational notifications
- PostHog for product analytics
- Sentry for error tracking

### Deployment Shape

For MVP there is no separate backend server.
The deployment consists of:

1. one Next.js app deployment
2. one managed PostgreSQL database
3. external services for storage, email, maps, analytics, and notifications

## Cost Expectations

### Cheapest Launch Setup

- domain: around 10-15 USD/year for .com
- Vercel Hobby: 0 USD
- managed Postgres free tier: 0 USD at very early stage
- Resend free tier: 0 USD
- Telegram bot: 0 USD
- Mapbox: usually free at low usage

### Practical MVP Budget

Rough monthly budget after the first real users:

- Vercel Pro: about 20 USD/month
- database plan: about 20-25 USD/month
- email: 0-20 USD/month
- maps: 0-50 USD/month depending on usage

Expected MVP operating cost: about 40-95 USD/month plus domain.

## Success Metrics

Track these metrics from week 1:

- trips created per day
- bookings created per day
- booking confirmation rate
- completed trips per day
- repeat users after 7 days
- driver cancellation rate
- passenger no-show rate
- average seats filled per trip
- average price per seat

## Build Order

### Phase 1

- initialize Next.js project
- set up Prisma and PostgreSQL
- set up authentication
- define schema and migrations
- implement profile and vehicle setup

### Phase 2

- create trip flow
- trip listing and filters
- trip details page
- booking flow
- driver confirmation flow

### Phase 3

- my trips and my bookings
- completion flow
- reviews
- notifications
- admin tools
- analytics and error tracking

## Working Rules

- build mobile-first
- optimize for speed to launch, not architecture complexity
- keep logic inside the main Next.js app until product demand is proven
- prefer manual moderation over overengineering in early versions
- add only features that improve liquidity, trust, or trip completion rate

## Definition of MVP Done

The MVP is ready when:

- a driver can create a trip in under 2 minutes
- a passenger can find and book a trip from a phone browser
- a driver can confirm or reject a booking
- both users receive notifications
- completed trips can collect reviews
- admin can manually intervene when something goes wrong

## Next Implementation Step

The next technical step after this document is to scaffold the Next.js project and lock the Prisma schema based on the entities above.
