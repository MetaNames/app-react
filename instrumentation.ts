import * as Sentry from "@sentry/nextjs";

export async function register() {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  const environment = process.env.NEXT_PUBLIC_ENV === "prod" ? "prod" : "test";
  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: environment === "prod" ? 0.1 : 1.0,
  });
}

export const onRequestError = Sentry.captureRequestError;
