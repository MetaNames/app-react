/**
 * Expiry is the one domain attribute that turns into a loss if it is ignored,
 * so it is surfaced in more than one place (the domain page banner, the
 * profile table). The classification lives here so those places cannot drift
 * apart on where the warning threshold sits or on how a missing date is read.
 */

/**
 * A domain inside this window is close enough to expiry that the owner should
 * be nudged while renewal is still possible.
 */
export const EXPIRY_WARNING_DAYS = 30;

export type ExpiryState =
  /** No expiry date at all — TLDs and anything the chain reports as perpetual. */
  | "never"
  /** The expiry date has passed. */
  | "expired"
  /** Expires within EXPIRY_WARNING_DAYS. */
  | "soon"
  /** Expires, but not soon enough to warn about. */
  | "active";

export interface ExpiryStatus {
  state: ExpiryState;
  /**
   * Whole days until expiry, rounded up, or null when there is no date.
   * Negative once the date has passed.
   */
  days: number | null;
}

const MS_PER_DAY = 86_400_000;

/**
 * Whole days from now until `date`, rounded up so that "expires later today"
 * reads as 1 day rather than 0. Returns null for a missing or unparseable
 * date — an invalid date must not be reported as "expires today".
 */
export function daysUntil(
  date: Date | string | null | undefined,
): number | null {
  if (!date) return null;
  const ms = new Date(date).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return Math.ceil(ms / MS_PER_DAY);
}

export function expiryStatus(
  date: Date | string | null | undefined,
): ExpiryStatus {
  const days = daysUntil(date);
  if (days === null) return { state: "never", days: null };
  if (days <= 0) return { state: "expired", days };
  if (days <= EXPIRY_WARNING_DAYS) return { state: "soon", days };
  return { state: "active", days };
}

/** True when the owner should be prompted to act: expired, or nearly so. */
export function needsAttention(status: ExpiryStatus): boolean {
  return status.state === "expired" || status.state === "soon";
}

/**
 * Short relative phrase for a status — "in 12 days", "Expired", "Never".
 * Callers that need the absolute date render it alongside; this is the part
 * that answers "should I care right now?".
 */
export function formatRelativeExpiry(status: ExpiryStatus): string {
  switch (status.state) {
    case "never":
      return "Never";
    case "expired":
      return "Expired";
    default:
      return `in ${status.days} ${status.days === 1 ? "day" : "days"}`;
  }
}
