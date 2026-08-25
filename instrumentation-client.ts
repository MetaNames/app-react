import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_ENV === "prod" ? "prod" : "test",
    tracesSampleRate: process.env.NEXT_PUBLIC_ENV === "prod" ? 0.1 : 1.0,
  });
}
