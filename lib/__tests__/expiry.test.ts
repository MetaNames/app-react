import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  EXPIRY_WARNING_DAYS,
  daysUntil,
  expiryStatus,
  formatRelativeExpiry,
  needsAttention,
} from "../expiry";

const NOW = new Date("2026-06-01T12:00:00.000Z");

function inDays(days: number): Date {
  return new Date(NOW.getTime() + days * 86_400_000);
}

describe("expiry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("daysUntil", () => {
    it("returns null for a missing date rather than 0", () => {
      expect(daysUntil(null)).toBeNull();
      expect(daysUntil(undefined)).toBeNull();
    });

    // An unparseable date must not collapse into "expires today", which would
    // show a false expiry warning on a domain that is fine.
    it("returns null for an unparseable date", () => {
      expect(daysUntil("not-a-date")).toBeNull();
    });

    it("rounds up, so a date later today is 1 day and not 0", () => {
      expect(daysUntil(new Date(NOW.getTime() + 3_600_000))).toBe(1);
    });

    it("is negative once the date has passed", () => {
      expect(daysUntil(inDays(-5))).toBe(-5);
    });

    it("accepts a date string as well as a Date", () => {
      expect(daysUntil(inDays(10).toISOString())).toBe(10);
    });
  });

  describe("expiryStatus", () => {
    it("reports never when there is no date", () => {
      expect(expiryStatus(null)).toEqual({ state: "never", days: null });
    });

    it("reports expired at and past the boundary", () => {
      expect(expiryStatus(NOW).state).toBe("expired");
      expect(expiryStatus(inDays(-1)).state).toBe("expired");
    });

    it("reports soon up to and including the warning threshold", () => {
      expect(expiryStatus(inDays(EXPIRY_WARNING_DAYS)).state).toBe("soon");
      expect(expiryStatus(inDays(1)).state).toBe("soon");
    });

    it("reports active one day past the warning threshold", () => {
      expect(expiryStatus(inDays(EXPIRY_WARNING_DAYS + 1)).state).toBe(
        "active",
      );
    });
  });

  describe("needsAttention", () => {
    it("is true only for expired and soon", () => {
      expect(needsAttention(expiryStatus(inDays(-1)))).toBe(true);
      expect(needsAttention(expiryStatus(inDays(5)))).toBe(true);
      expect(needsAttention(expiryStatus(inDays(365)))).toBe(false);
      expect(needsAttention(expiryStatus(null))).toBe(false);
    });
  });

  describe("formatRelativeExpiry", () => {
    it("singularises a one-day remainder", () => {
      expect(formatRelativeExpiry(expiryStatus(inDays(1)))).toBe("in 1 day");
    });

    it("pluralises everything else", () => {
      expect(formatRelativeExpiry(expiryStatus(inDays(12)))).toBe("in 12 days");
    });

    it("collapses past dates to Expired and missing dates to Never", () => {
      expect(formatRelativeExpiry(expiryStatus(inDays(-9)))).toBe("Expired");
      expect(formatRelativeExpiry(expiryStatus(null))).toBe("Never");
    });
  });
});
