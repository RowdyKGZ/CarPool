import { BookingStatus, TripStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { bishkekDayBounds } from "@/lib/datetime";

export type TripsDateFilter = "today" | "tomorrow" | "all";
export type DriverTripsFilter = "upcoming" | "past";

/** Published trips visible in the public listing, filtered by departure day. */
export function listPublishedTrips(filter: TripsDateFilter) {
  const now = new Date();
  const todayBounds = bishkekDayBounds(0);
  const tomorrowBounds = bishkekDayBounds(1);

  const departureAt =
    filter === "today"
      ? { gte: now > todayBounds.gte ? now : todayBounds.gte, lt: todayBounds.lt }
      : filter === "tomorrow"
        ? tomorrowBounds
        : { gte: now };

  return db.trip.findMany({
    where: { status: TripStatus.PUBLISHED, departureAt },
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
}

/** Full trip detail with driver + vehicle for the trip page. */
export function getTripDetail(id: string) {
  return db.trip.findUnique({
    where: { id },
    include: {
      driver: {
        select: {
          name: true,
          telegramUsername: true,
          driverProfile: {
            select: { bio: true, averageRating: true, tripsCompleted: true },
          },
        },
      },
      vehicle: {
        select: { make: true, model: true, color: true, plateNumber: true },
      },
    },
  });
}

/** Trips authored by a driver, split into upcoming/past with pending-booking counts. */
/** A driver's upcoming published trips — used to build a template from one. */
export function listDriverActiveTrips(driverId: string) {
  return db.trip.findMany({
    where: {
      driverId,
      status: TripStatus.PUBLISHED,
      departureAt: { gte: new Date() },
    },
    select: {
      id: true,
      pickupLabel: true,
      dropoffLabel: true,
      departureAt: true,
    },
    orderBy: { departureAt: "asc" },
  });
}

export function listDriverTrips(driverId: string, filter: DriverTripsFilter) {
  const now = new Date();
  return db.trip.findMany({
    where: {
      driverId,
      departureAt: filter === "upcoming" ? { gte: now } : { lt: now },
    },
    select: {
      id: true,
      pickupLabel: true,
      dropoffLabel: true,
      departureAt: true,
      pricePerSeat: true,
      availableSeats: true,
      totalSeats: true,
      status: true,
      _count: {
        select: { bookings: { where: { status: BookingStatus.PENDING } } },
      },
    },
    orderBy: { departureAt: filter === "upcoming" ? "asc" : "desc" },
  });
}
