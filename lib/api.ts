import * as Sentry from "@sentry/nextjs";
import type {
  BYOCSymbol,
  Domain,
  DomainCheckResponse,
  FeesResponse,
} from "./types";

const GENERIC_ERROR = "Something went wrong";

type ApiResult<T> = { data: T | null; error: string | null };

// Shared fetch/error handling for every API helper below, matching legacy's
// precedence exactly: prefer the server's own `error` message when the response
// body carries one, otherwise fall back to a generic message — never surface a raw
// exception's `.message` to the user. Network/parse failures are reported to
// Sentry (client-side fetch failures were previously silent) and also collapse to
// the generic message.
async function request<T>(
  url: string,
  mapOk: (json: unknown) => T,
): Promise<ApiResult<T>> {
  let response: Response | undefined;

  try {
    response = await fetch(url);
    const json = await response.json();

    if (!response.ok) {
      const message =
        json && typeof json === "object" && "error" in json && json.error
          ? String((json as { error: unknown }).error)
          : GENERIC_ERROR;

      return { data: null, error: message };
    }

    return { data: mapOk(json), error: null };
  } catch (error) {
    console.error(error);

    // Only the request shape, never anything that could carry auth material.
    Sentry.captureException(error, {
      extra: { url, status: response?.status },
    });

    return { data: null, error: GENERIC_ERROR };
  }
}

export async function fetchDomain(
  name: string,
): Promise<{ data: Domain | null; error: string | null }> {
  return request<Domain | null>(
    `/api/domains/${encodeURIComponent(name)}`,
    (json) => (json as { domain?: Domain | null })?.domain ?? null,
  );
}

export async function checkDomain(
  name: string,
): Promise<{ data: DomainCheckResponse | null; error: string | null }> {
  return request<DomainCheckResponse>(
    `/api/domains/${encodeURIComponent(name)}/check`,
    (json) => json as DomainCheckResponse,
  );
}

export async function fetchRegistrationFees(
  name: string,
  coin: BYOCSymbol,
): Promise<{ data: FeesResponse | null; error: string | null }> {
  return request<FeesResponse>(
    `/api/register/${encodeURIComponent(name)}/fees/${coin}`,
    (json) => json as FeesResponse,
  );
}
