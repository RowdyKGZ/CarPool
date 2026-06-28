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

/** Full `datetime-local` value ("YYYY-MM-DDTHH:MM") of a timestamp in Bishkek. */
export function formatBishkekDatetimeLocal(date: Date): string {
  const b = new Date(date.getTime() + BISHKEK_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${b.getUTCFullYear()}-${pad(b.getUTCMonth() + 1)}-${pad(b.getUTCDate())}T${pad(b.getUTCHours())}:${pad(b.getUTCMinutes())}`;
}

/** Time-of-day "HH:MM" of a timestamp on the Bishkek wall clock. */
export function formatBishkekTime(date: Date): string {
  const bishkek = new Date(date.getTime() + BISHKEK_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(bishkek.getUTCHours())}:${pad(bishkek.getUTCMinutes())}`;
}

/**
 * Builds a `datetime-local` value ("YYYY-MM-DDTHH:MM") for the next future
 * occurrence of a Bishkek wall-clock time. If `time` ("HH:MM") is omitted or the
 * slot has already passed today, the next day is used. Used to prefill the trip
 * form when launching a template.
 */
export function nextBishkekOccurrenceLocal(time?: string | null): string {
  const now = new Date();
  const bishkekNow = new Date(now.getTime() + BISHKEK_OFFSET_MS);
  const match = time?.match(/^(\d{1,2}):(\d{2})$/);
  const hours = match ? Math.min(23, Number(match[1])) : bishkekNow.getUTCHours();
  const minutes = match ? Math.min(59, Number(match[2])) : bishkekNow.getUTCMinutes();

  let y = bishkekNow.getUTCFullYear();
  let m = bishkekNow.getUTCMonth();
  let d = bishkekNow.getUTCDate();

  const slotToday = Date.UTC(y, m, d, hours, minutes);
  if (slotToday <= bishkekNow.getTime()) {
    const tomorrow = new Date(Date.UTC(y, m, d + 1));
    y = tomorrow.getUTCFullYear();
    m = tomorrow.getUTCMonth();
    d = tomorrow.getUTCDate();
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${pad(m + 1)}-${pad(d)}T${pad(hours)}:${pad(minutes)}`;
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
