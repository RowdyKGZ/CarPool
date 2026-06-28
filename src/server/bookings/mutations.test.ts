import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookingStatus, TripStatus } from "@prisma/client";

const { db } = vi.hoisted(() => ({
  db: {
    $transaction: vi.fn(),
    booking: { findUnique: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/server/notifications/events", () => ({
  notifyBookingRequest: vi.fn(),
}));

import {
  createBooking,
  markBookingAttended,
  markBookingNoShow,
} from "./mutations";

type Tx = {
  trip: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  booking: {
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
};

function mockTransaction(tx: Tx) {
  db.$transaction.mockImplementation(
    async (cb: (tx: Tx) => Promise<unknown>) => cb(tx),
  );
}

const future = new Date(Date.now() + 24 * 60 * 60 * 1000);

function makeTx(overrides: Partial<{ trip: unknown; existing: unknown }> = {}): Tx {
  return {
    trip: {
      findUnique: vi.fn().mockResolvedValue(
        "trip" in overrides
          ? overrides.trip
          : {
              status: TripStatus.PUBLISHED,
              availableSeats: 4,
              driverId: "driver",
              departureAt: future,
            },
      ),
      update: vi.fn().mockResolvedValue({}),
    },
    booking: {
      findFirst: vi.fn().mockResolvedValue(overrides.existing ?? null),
      create: vi.fn().mockResolvedValue({}),
    },
  };
}

const input = { tripId: "t1", seatsRequested: 2, note: null };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createBooking conflicts", () => {
  it("rejects when the trip is missing/unpublished", async () => {
    mockTransaction(makeTx({ trip: null }));
    expect(await createBooking("passenger", input)).toEqual({
      ok: false,
      reason: "TRIP_UNAVAILABLE",
    });
  });

  it("rejects booking a trip that already departed", async () => {
    mockTransaction(
      makeTx({
        trip: {
          status: TripStatus.PUBLISHED,
          availableSeats: 4,
          driverId: "driver",
          departureAt: new Date(Date.now() - 1000),
        },
      }),
    );
    expect(await createBooking("passenger", input)).toEqual({
      ok: false,
      reason: "TRIP_DEPARTED",
    });
  });

  it("rejects booking your own trip", async () => {
    mockTransaction(
      makeTx({
        trip: {
          status: TripStatus.PUBLISHED,
          availableSeats: 4,
          driverId: "me",
          departureAt: future,
        },
      }),
    );
    expect(await createBooking("me", input)).toEqual({
      ok: false,
      reason: "OWN_TRIP",
    });
  });

  it("rejects when not enough seats are available", async () => {
    mockTransaction(
      makeTx({
        trip: {
          status: TripStatus.PUBLISHED,
          availableSeats: 1,
          driverId: "driver",
          departureAt: future,
        },
      }),
    );
    expect(await createBooking("passenger", input)).toEqual({
      ok: false,
      reason: "NOT_ENOUGH_SEATS",
    });
  });

  it("rejects a duplicate active booking", async () => {
    mockTransaction(makeTx({ existing: { id: "b1" } }));
    expect(await createBooking("passenger", input)).toEqual({
      ok: false,
      reason: "ALREADY_BOOKED",
    });
  });

  it("succeeds and decrements seats on a valid booking", async () => {
    const tx = makeTx();
    mockTransaction(tx);
    expect(await createBooking("passenger", input)).toEqual({ ok: true });
    expect(tx.booking.create).toHaveBeenCalled();
    expect(tx.trip.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { availableSeats: { decrement: 2 } },
      }),
    );
  });
});

describe("no-show attendance", () => {
  it("marks a completed booking as no-show", async () => {
    db.booking.findUnique.mockResolvedValue({
      status: BookingStatus.COMPLETED,
      trip: { id: "t1", driverId: "driver" },
    });
    expect(await markBookingNoShow("driver", "b1")).toEqual({
      ok: true,
      tripId: "t1",
    });
    expect(db.booking.update).toHaveBeenCalledWith({
      where: { id: "b1" },
      data: { status: BookingStatus.NO_SHOW },
    });
  });

  it("reverts a no-show back to completed", async () => {
    db.booking.findUnique.mockResolvedValue({
      status: BookingStatus.NO_SHOW,
      trip: { id: "t1", driverId: "driver" },
    });
    expect(await markBookingAttended("driver", "b1")).toEqual({
      ok: true,
      tripId: "t1",
    });
    expect(db.booking.update).toHaveBeenCalledWith({
      where: { id: "b1" },
      data: { status: BookingStatus.COMPLETED },
    });
  });

  it("forbids a driver who doesn't own the trip", async () => {
    db.booking.findUnique.mockResolvedValue({
      status: BookingStatus.COMPLETED,
      trip: { id: "t1", driverId: "someone-else" },
    });
    expect(await markBookingNoShow("driver", "b1")).toEqual({
      ok: false,
      reason: "FORBIDDEN",
    });
    expect(db.booking.update).not.toHaveBeenCalled();
  });

  it("rejects marking no-show on a booking that isn't completed", async () => {
    db.booking.findUnique.mockResolvedValue({
      status: BookingStatus.PENDING,
      trip: { id: "t1", driverId: "driver" },
    });
    expect(await markBookingNoShow("driver", "b1")).toEqual({
      ok: false,
      reason: "INVALID_STATE",
    });
    expect(db.booking.update).not.toHaveBeenCalled();
  });
});
