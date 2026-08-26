/**
 * Shared "did this load actually succeed" helpers.
 *
 * The API/SDK calls this app makes return either a value or an explicit
 * error string, or they can throw. Treating "errored" the same as "known
 * negative result" (e.g. "domain not present") is the bug this module
 * exists to prevent: a failed availability check is not the same thing as
 * an available domain, and a failed domain load is not the same thing as a
 * confirmed non-existent domain. Callers should redirect home with an alert
 * on a genuine load failure, not silently treat it as a green light.
 */

/** Result of a fallible load: either a value, or a human-readable failure message. */
export type LoadResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

/**
 * Awaits `promise`, converting a thrown error into a `LoadResult` instead of
 * letting it propagate. Use this to distinguish "the load failed" from
 * "the load succeeded with a negative/empty result" (e.g. `null`).
 */
export async function loadOrReport<T>(
  promise: Promise<T>,
  fallbackMessage: string,
): Promise<LoadResult<T>> {
  try {
    const value = await promise;
    return { ok: true, value };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : fallbackMessage,
    };
  }
}

/**
 * Shape shared by this app's `{ data, error }`-returning API helpers
 * (see `lib/api.ts`'s `checkDomain`).
 */
export interface DataOrError<T> {
  data: T | null;
  error: string | null;
}

/**
 * Narrows a `{ data, error }` API response into a `LoadResult`, treating a
 * present `error` (or a missing `data`) as a failed load rather than a
 * usable negative result. This is what closes the "API error silently
 * treated as an available domain" gap.
 *
 * Only use this with helpers whose `data` is absent *only* on failure. A
 * helper that returns `data: null` to mean a legitimate negative result
 * (`lib/api.ts`'s `fetchDomain` returns null for a domain that simply does
 * not exist) would be misreported here as a failed load — which is the exact
 * confusion this module exists to prevent. Use `loadOrReport` and an explicit
 * null check for those.
 */
export function resultOrReport<T>(
  response: DataOrError<T>,
  fallbackMessage: string,
): LoadResult<T> {
  if (response.error || response.data === null) {
    return { ok: false, message: response.error ?? fallbackMessage };
  }
  return { ok: true, value: response.data };
}
