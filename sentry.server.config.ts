import * as Sentry from "@sentry/nextjs";

// Runtime-only setup (no withSentryConfig): captures errors when SENTRY_DSN is
// set, otherwise stays a no-op. Source-map upload is intentionally skipped.
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === "production",
  });
}
