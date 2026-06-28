import { ReportStatus, TripStatus } from "@prisma/client";
import { db } from "@/lib/db";

export const ADMIN_PAGE_SIZE = 50;

/** Slices off the extra +1 row used to detect a next page. */
function paginate<T>(rows: T[], page: number) {
  const hasMore = rows.length > ADMIN_PAGE_SIZE;
  return {
    items: hasMore ? rows.slice(0, ADMIN_PAGE_SIZE) : rows,
    page,
    hasMore,
  };
}

export async function getAdminOverview() {
  const [users, publishedTrips, openReports] = await Promise.all([
    db.user.count(),
    db.trip.count({ where: { status: TripStatus.PUBLISHED } }),
    db.report.count({ where: { status: ReportStatus.OPEN } }),
  ]);
  return { users, publishedTrips, openReports };
}

export async function listUsersForAdmin(page = 1) {
  const currentPage = Math.max(1, page);
  const rows = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * ADMIN_PAGE_SIZE,
    take: ADMIN_PAGE_SIZE + 1,
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
  return paginate(rows, currentPage);
}

export async function listTripsForAdmin(page = 1) {
  const currentPage = Math.max(1, page);
  const rows = await db.trip.findMany({
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * ADMIN_PAGE_SIZE,
    take: ADMIN_PAGE_SIZE + 1,
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
  return paginate(rows, currentPage);
}

export async function listReportsForAdmin(page = 1) {
  const currentPage = Math.max(1, page);
  const rows = await db.report.findMany({
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * ADMIN_PAGE_SIZE,
    take: ADMIN_PAGE_SIZE + 1,
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
  return paginate(rows, currentPage);
}
