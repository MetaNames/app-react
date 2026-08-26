import * as Sentry from "@sentry/nextjs";
import { config } from "@/lib/config";

export async function register() {
  if (!config.sentryDsn) return;
  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.environment,
    tracesSampleRate: config.sentryTracesSampleRate,
  });
}

export const onRequestError = Sentry.captureRequestError;
