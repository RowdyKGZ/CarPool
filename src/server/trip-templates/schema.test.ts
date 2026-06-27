import { describe, expect, it } from "vitest";
import { tripTemplateCreateSchema } from "./schema";

const base = {
  title: "Дом → Работа",
  pickupLabel: "Восток-5",
  dropoffLabel: "Ала-Тоо",
  pricePerSeat: "100",
  totalSeats: "4",
  comment: "",
  departureTime: "08:30",
};

describe("tripTemplateCreateSchema", () => {
  it("accepts a valid template and coerces numbers", () => {
    const result = tripTemplateCreateSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pricePerSeat).toBe(100);
      expect(result.data.totalSeats).toBe(4);
      expect(result.data.departureTime).toBe("08:30");
    }
  });

  it("treats an empty departureTime as null", () => {
    const result = tripTemplateCreateSchema.safeParse({
      ...base,
      departureTime: "",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.departureTime).toBeNull();
  });

  it("rejects a malformed departureTime", () => {
    const result = tripTemplateCreateSchema.safeParse({
      ...base,
      departureTime: "25:99",
    });
    expect(result.success).toBe(false);
  });

  it("rejects too many seats", () => {
    const result = tripTemplateCreateSchema.safeParse({ ...base, totalSeats: "9" });
    expect(result.success).toBe(false);
  });

  it("requires a pickup label of at least 3 chars", () => {
    const result = tripTemplateCreateSchema.safeParse({ ...base, pickupLabel: "ab" });
    expect(result.success).toBe(false);
  });
});
