// Shared date/time helpers. The product operates in Bishkek (UTC+6); times are
// stored in UTC and rendered/queried against the Bishkek wall clock.
const BISHKEK_OFFSET_MS = 6 * 60 * 60 * 1000;

/** Formats a departure timestamp in the Bishkek timezone for UI display. */
export function formatDeparture(date: Date): string {
  return date.toLocaleString("ru-RU", {
    timeZone: "Asia/Bishkek",
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** UTC bounds `[gte, lt)` covering a Bishkek calendar day, shifted by `offsetDays`. */
export function bishkekDayBounds(offsetDays: number): { gte: Date; lt: Date } {
  const now = new Date();
  const bishkekNow = new Date(now.getTime() + BISHKEK_OFFSET_MS);
  const y = bishkekNow.getUTCFullYear();
  const m = bishkekNow.getUTCMonth();
  const d = bishkekNow.getUTCDate();
  return {
    gte: new Date(Date.UTC(y, m, d + offsetDays) - BISHKEK_OFFSET_MS),
    lt: new Date(Date.UTC(y, m, d + offsetDays + 1) - BISHKEK_OFFSET_MS),
  };
}

/** Parses a `datetime-local` value ("YYYY-MM-DDTHH:MM"[:SS]) as Bishkek wall time. */
export function parseBishkekDatetime(value: string): Date | null {
  const normalized =
    value.length === 16
      ? `${value}:00+06:00`
      : value.length === 19
        ? `${value}+06:00`
        : value;
  const date = new Date(normalized);
  return isNaN(date.getTime()) ? null : date;
}
