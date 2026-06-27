import { beforeEach, describe, expect, it, vi } from "vitest";
import { TripStatus } from "@prisma/client";

const { db } = vi.hoisted(() => ({ db: { $transaction: vi.fn() } }));
vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/server/notifications/events", () => ({
  notifyBookingRequest: vi.fn(),
}));

import { createBooking } from "./mutations";

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

function makeTx(overrides: Partial<{ trip: unknown; existing: unknown }> = {}): Tx {
  return {
    trip: {
      findUnique: vi.fn().mockResolvedValue(
        "trip" in overrides
          ? overrides.trip
          : { status: TripStatus.PUBLISHED, availableSeats: 4, driverId: "driver" },
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

  it("rejects booking your own trip", async () => {
    mockTransaction(
      makeTx({
        trip: { status: TripStatus.PUBLISHED, availableSeats: 4, driverId: "me" },
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
        trip: { status: TripStatus.PUBLISHED, availableSeats: 1, driverId: "driver" },
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
