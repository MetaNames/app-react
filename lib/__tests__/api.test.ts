import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { BYOCSymbol } from "../types";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("lib/api", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    mockFetch.mockRestore();
    vi.clearAllMocks();
  });

  describe("fetchDomain", () => {
    it("calls fetch with correct URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ domain: { name: "test.mpc" } }),
      });

      const { fetchDomain } = await import("../api");
      await fetchDomain("test.mpc");

      expect(mockFetch).toHaveBeenCalledWith("/api/domains/test.mpc");
    });

    it("returns domain when found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ domain: { name: "test.mpc", owner: "0x1234" } }),
      });

      const { fetchDomain } = await import("../api");
      const result = await fetchDomain("test.mpc");

      expect(result.data).toEqual({ name: "test.mpc", owner: "0x1234" });
    });

    it("returns null when domain not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ domain: null }),
      });

      const { fetchDomain } = await import("../api");
      const result = await fetchDomain("notfound.mpc");

      expect(result.data).toBeNull();
    });

    it("surfaces the server's error message on a non-ok response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "Domain not found" }),
      });

      const { fetchDomain } = await import("../api");
      const result = await fetchDomain("test.mpc");

      expect(result.data).toBeNull();
      expect(result.error).toBe("Domain not found");
    });

    it("falls back to a generic error when the server sends none", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      const { fetchDomain } = await import("../api");
      const result = await fetchDomain("test.mpc");

      expect(result.data).toBeNull();
      expect(result.error).toBe("Something went wrong");
    });

    it("encodes domain name in URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ domain: null }),
      });

      const { fetchDomain } = await import("../api");
      await fetchDomain("test domain");

      expect(mockFetch).toHaveBeenCalledWith("/api/domains/test%20domain");
    });

    it("returns a generic error and reports to Sentry on network failure", async () => {
      const Sentry = await import("@sentry/nextjs");
      const error = new Error("Network error");
      mockFetch.mockRejectedValueOnce(error);

      const { fetchDomain } = await import("../api");
      const result = await fetchDomain("test.mpc");

      expect(result).toEqual({ data: null, error: "Something went wrong" });
      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.any(Object),
      );
    });
  });

  describe("checkDomain", () => {
    it("calls fetch with correct URL", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ domainPresent: false, parentPresent: false }),
      });

      const { checkDomain } = await import("../api");
      await checkDomain("sub.test.mpc");

      expect(mockFetch).toHaveBeenCalledWith("/api/domains/sub.test.mpc/check");
    });

    it("returns domainPresent and parentPresent when available", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ domainPresent: true, parentPresent: true }),
      });

      const { checkDomain } = await import("../api");
      const result = await checkDomain("sub.test.mpc");

      expect(result.data).toEqual({ domainPresent: true, parentPresent: true });
    });

    it("surfaces the server's error message on a non-ok response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Invalid domain" }),
      });

      const { checkDomain } = await import("../api");
      const result = await checkDomain("test.mpc");

      expect(result.data).toBeNull();
      expect(result.error).toBe("Invalid domain");
    });
  });

  describe("fetchRegistrationFees", () => {
    it("calls fetch with correct URL for TEST_COIN", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            feesLabel: "10.5",
            fees: 10.5,
            symbol: "TEST_COIN",
            address: "0x1234",
          }),
      });

      const { fetchRegistrationFees } = await import("../api");
      await fetchRegistrationFees("test.mpc", "TEST_COIN");

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/register/test.mpc/fees/TEST_COIN",
      );
    });

    it("calls fetch with correct URL for ETH_GOERLI", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            feesLabel: "0.0001",
            fees: 0.0001,
            symbol: "ETH_GOERLI",
            address: "0x1234",
          }),
      });

      const { fetchRegistrationFees } = await import("../api");
      await fetchRegistrationFees("mydomain.mpc", "ETH_GOERLI");

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/register/mydomain.mpc/fees/ETH_GOERLI",
      );
    });

    it("returns fees response when successful", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            feesLabel: "10.5",
            fees: 10.5,
            symbol: "TEST_COIN",
            address: "0x1234",
          }),
      });

      const { fetchRegistrationFees } = await import("../api");
      const result = await fetchRegistrationFees("test.mpc", "TEST_COIN");

      expect(result.data).toEqual({
        feesLabel: "10.5",
        fees: 10.5,
        symbol: "TEST_COIN",
        address: "0x1234",
      });
    });

    it("falls back to a generic error when the server sends none", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      const { fetchRegistrationFees } = await import("../api");
      const result = await fetchRegistrationFees("test.mpc", "ETH");

      expect(result.data).toBeNull();
      expect(result.error).toBe("Something went wrong");
    });

    it("handles all supported BYOC symbols", async () => {
      const symbols: BYOCSymbol[] = ["TEST_COIN", "ETH_GOERLI"];

      for (const symbol of symbols) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              feesLabel: "1",
              fees: 1,
              symbol,
              address: "0x1234",
            }),
        });

        const { fetchRegistrationFees } = await import("../api");
        const result = await fetchRegistrationFees("test.mpc", symbol);

        expect(mockFetch).toHaveBeenCalledWith(
          `/api/register/test.mpc/fees/${symbol}`,
        );
        expect(result.data?.symbol).toBe(symbol);
        mockFetch.mockReset();
      }
    });
  });
});
