import { describe, expect, it, vi, afterEach } from "vitest";
import {
  formatBishkekTime,
  nextBishkekOccurrenceLocal,
  parseBishkekDatetime,
} from "./datetime";

describe("formatBishkekTime", () => {
  it("renders the Bishkek (UTC+6) wall-clock time", () => {
    // 2026-06-27T02:30:00Z → 08:30 in Bishkek
    expect(formatBishkekTime(new Date("2026-06-27T02:30:00Z"))).toBe("08:30");
  });

  it("zero-pads hours and minutes", () => {
    expect(formatBishkekTime(new Date("2026-06-27T01:05:00Z"))).toBe("07:05");
  });
});

describe("parseBishkekDatetime", () => {
  it("parses a datetime-local string as Bishkek wall time", () => {
    const date = parseBishkekDatetime("2026-06-27T08:30");
    expect(date?.toISOString()).toBe("2026-06-27T02:30:00.000Z");
  });

  it("returns null for invalid input", () => {
    expect(parseBishkekDatetime("not-a-date")).toBeNull();
  });
});

describe("nextBishkekOccurrenceLocal", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses today when the slot is still ahead", () => {
    // Bishkek time = 2026-06-27 08:00; slot 20:00 is later today.
    vi.setSystemTime(new Date("2026-06-27T02:00:00Z"));
    expect(nextBishkekOccurrenceLocal("20:00")).toBe("2026-06-27T20:00");
  });

  it("rolls to tomorrow when the slot already passed", () => {
    // Bishkek time = 2026-06-27 08:00; slot 06:00 has passed → next day.
    vi.setSystemTime(new Date("2026-06-27T02:00:00Z"));
    expect(nextBishkekOccurrenceLocal("06:00")).toBe("2026-06-28T06:00");
  });

  it("round-trips with parseBishkekDatetime to a future date", () => {
    vi.setSystemTime(new Date("2026-06-27T02:00:00Z"));
    const local = nextBishkekOccurrenceLocal("06:00");
    const parsed = parseBishkekDatetime(local);
    expect(parsed!.getTime()).toBeGreaterThan(Date.now());
  });
});
