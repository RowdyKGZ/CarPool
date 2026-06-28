import { BookingStatus, TripStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { bishkekDayBounds } from "@/lib/datetime";

export type TripsDateFilter = "today" | "tomorrow" | "all";
export type DriverTripsFilter = "upcoming" | "past";

export const TRIPS_PAGE_SIZE = 20;
export const DRIVER_TRIPS_PAGE_SIZE = 20;

/** Published trips visible in the public listing, filtered by departure day and
 * optional from/to district, paginated (1-based `page`). `hasMore` signals
 * whether a next page exists. */
export async function listPublishedTrips(
  filter: TripsDateFilter,
  params: { from?: string | null; to?: string | null; page?: number } = {},
) {
  const { from, to, page = 1 } = params;
  const now = new Date();
  const todayBounds = bishkekDayBounds(0);
  const tomorrowBounds = bishkekDayBounds(1);

  const departureAt =
    filter === "today"
      ? { gte: now > todayBounds.gte ? now : todayBounds.gte, lt: todayBounds.lt }
      : filter === "tomorrow"
        ? tomorrowBounds
        : { gte: now };

  const currentPage = Math.max(1, page);
  const rows = await db.trip.findMany({
    where: {
      status: TripStatus.PUBLISHED,
      departureAt,
      fromDistrict: from || undefined,
      toDistrict: to || undefined,
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
    skip: (currentPage - 1) * TRIPS_PAGE_SIZE,
    take: TRIPS_PAGE_SIZE + 1,
  });

  const hasMore = rows.length > TRIPS_PAGE_SIZE;
  return {
    trips: hasMore ? rows.slice(0, TRIPS_PAGE_SIZE) : rows,
    page: currentPage,
    hasMore,
  };
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

export async function listDriverTrips(
  driverId: string,
  filter: DriverTripsFilter,
  page = 1,
) {
  const now = new Date();
  const currentPage = Math.max(1, page);
  const rows = await db.trip.findMany({
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
    skip: (currentPage - 1) * DRIVER_TRIPS_PAGE_SIZE,
    take: DRIVER_TRIPS_PAGE_SIZE + 1,
  });

  const hasMore = rows.length > DRIVER_TRIPS_PAGE_SIZE;
  return {
    trips: hasMore ? rows.slice(0, DRIVER_TRIPS_PAGE_SIZE) : rows,
    page: currentPage,
    hasMore,
  };
}
