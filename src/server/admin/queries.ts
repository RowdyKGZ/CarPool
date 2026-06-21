import { ReportStatus, TripStatus } from "@prisma/client";
import { db } from "@/lib/db";

export async function getAdminOverview() {
  const [users, publishedTrips, openReports] = await Promise.all([
    db.user.count(),
    db.trip.count({ where: { status: TripStatus.PUBLISHED } }),
    db.report.count({ where: { status: ReportStatus.OPEN } }),
  ]);
  return { users, publishedTrips, openReports };
}

export function listUsersForAdmin() {
  return db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      _count: { select: { tripsDriven: true, bookings: true } },
    },
  });
}

export function listTripsForAdmin() {
  return db.trip.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      pickupLabel: true,
      dropoffLabel: true,
      departureAt: true,
      status: true,
      availableSeats: true,
      totalSeats: true,
      driver: { select: { name: true } },
    },
  });
}

export function listReportsForAdmin() {
  return db.report.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      reason: true,
      note: true,
      status: true,
      tripId: true,
      createdAt: true,
      reporter: { select: { name: true } },
      targetUser: { select: { name: true } },
    },
  });
}
