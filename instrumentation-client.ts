import * as Sentry from "@sentry/nextjs";
import { config } from "@/lib/config";

if (config.sentryDsn) {
  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.environment,
    tracesSampleRate: config.sentryTracesSampleRate,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
