import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const jsonError = (status: number, message: string) =>
  NextResponse.json({ error: message }, { status });

/**
 * Wraps an API route handler with centralized error handling, mirroring
 * legacy's `handleError` (app-legacy/src/lib/server/index.ts): any thrown
 * error is logged, reported to Sentry, and answered with a generic 500 so
 * internal error details (stack traces, query shapes, internal URLs) never
 * reach the client. An error shaped like an HTTP error (numeric `status`
 * plus a string `body.message`) is assumed to already carry a client-safe
 * message and is passed through with its real status instead.
 */
export async function handleError(
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);

    const httpError = error as {
      status?: unknown;
      body?: { message?: unknown };
    };
    if (
      typeof httpError?.status === "number" &&
      typeof httpError?.body?.message === "string"
    ) {
      return jsonError(httpError.status, httpError.body.message);
    }

    return jsonError(500, "Internal Server Error");
  }
}
