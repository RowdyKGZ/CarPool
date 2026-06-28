import { beforeEach, describe, expect, it, vi } from "vitest";

const { db } = vi.hoisted(() => ({
  db: {
    tripTemplate: { findFirst: vi.fn(), create: vi.fn() },
  },
}));
vi.mock("@/lib/db", () => ({ db }));

import { createTemplate } from "./mutations";
import type { TripTemplateCreateInput } from "./schema";

const input: TripTemplateCreateInput = {
  title: "Дом → Работа",
  pickupLabel: "Дом",
  dropoffLabel: "Работа",
  departureTime: "08:30",
  pricePerSeat: 100,
  totalSeats: 3,
  comment: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createTemplate dedupe", () => {
  it("creates a template when no duplicate exists", async () => {
    db.tripTemplate.findFirst.mockResolvedValue(null);
    db.tripTemplate.create.mockResolvedValue({ id: "new" });

    expect(await createTemplate("driver", input)).toEqual({
      ok: true,
      id: "new",
    });
    expect(db.tripTemplate.create).toHaveBeenCalled();
  });

  it("refuses a near-duplicate and points at the existing one", async () => {
    db.tripTemplate.findFirst.mockResolvedValue({ id: "existing" });

    expect(await createTemplate("driver", input)).toEqual({
      ok: false,
      reason: "DUPLICATE",
      id: "existing",
    });
    expect(db.tripTemplate.create).not.toHaveBeenCalled();
  });

  it("matches the duplicate on driver, route and departure time", async () => {
    db.tripTemplate.findFirst.mockResolvedValue(null);
    db.tripTemplate.create.mockResolvedValue({ id: "new" });

    await createTemplate("driver", input);

    expect(db.tripTemplate.findFirst).toHaveBeenCalledWith({
      where: {
        driverId: "driver",
        pickupLabel: "Дом",
        dropoffLabel: "Работа",
        departureTime: "08:30",
      },
      select: { id: true },
    });
  });
});
