import { BookingStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { ACTIVE_BOOKING_STATUSES } from "./schema";

/** Passengers who actually rode a trip (COMPLETED booking) — for driver reviews. */
export function listCompletedBookingPassengers(tripId: string) {
  return db.booking.findMany({
    where: { tripId, status: BookingStatus.COMPLETED },
    select: { passengerId: true, passenger: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
}

/** Whether the passenger has a COMPLETED booking on the trip (rode it). */
export function passengerHasCompletedBooking(tripId: string, passengerId: string) {
  return db.booking
    .findFirst({
      where: { tripId, passengerId, status: BookingStatus.COMPLETED },
      select: { id: true },
    })
    .then(Boolean);
}

export const BOOKINGS_PAGE_SIZE = 20;

const passengerBookingSelect = {
  id: true,
  status: true,
  seatsRequested: true,
  note: true,
  createdAt: true,
  trip: {
    select: {
      id: true,
      pickupLabel: true,
      dropoffLabel: true,
      departureAt: true,
      pricePerSeat: true,
      driver: {
        select: { name: true, phone: true, telegramUsername: true },
      },
    },
  },
} as const;

/** A passenger's active (pending/confirmed) bookings — few, shown in full. */
export function listActivePassengerBookings(passengerId: string) {
  return db.booking.findMany({
    where: { passengerId, status: { in: ACTIVE_BOOKING_STATUSES } },
    select: passengerBookingSelect,
    orderBy: { createdAt: "desc" },
  });
}

/** A passenger's finished bookings (history), paginated newest-first. */
export async function listPastPassengerBookings(passengerId: string, page = 1) {
  const currentPage = Math.max(1, page);
  const rows = await db.booking.findMany({
    where: { passengerId, status: { notIn: ACTIVE_BOOKING_STATUSES } },
    select: passengerBookingSelect,
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * BOOKINGS_PAGE_SIZE,
    take: BOOKINGS_PAGE_SIZE + 1,
  });

  const hasMore = rows.length > BOOKINGS_PAGE_SIZE;
  return {
    bookings: hasMore ? rows.slice(0, BOOKINGS_PAGE_SIZE) : rows,
    page: currentPage,
    hasMore,
  };
}

/** All bookings on a trip, for the driver's moderation view. */
export function listTripBookings(tripId: string) {
  return db.booking.findMany({
    where: { tripId },
    select: {
      id: true,
      status: true,
      seatsRequested: true,
      note: true,
      passenger: {
        select: { name: true, phone: true, telegramUsername: true },
      },
    },
    orderBy: [{ createdAt: "asc" }],
  });
}

/** The passenger's current active booking on a trip, if any. */
export function getActiveBookingForTrip(tripId: string, passengerId: string) {
  return db.booking.findFirst({
    where: {
      tripId,
      passengerId,
      status: { in: ACTIVE_BOOKING_STATUSES },
    },
    select: { status: true, seatsRequested: true },
  });
}
