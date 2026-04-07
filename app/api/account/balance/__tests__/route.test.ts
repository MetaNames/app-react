import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "../route";
import { NextRequest } from "next/server";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("app/api/account/balance/route", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.resetModules();
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  describe("POST", () => {
    it("calls backend.browser.testnet.partisiablockchain.com when NEXT_PUBLIC_ENV=test", async () => {
      process.env.NEXT_PUBLIC_ENV = "test";
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            account: {
              displayCoins: [{ symbol: "PARTI", balance: "100" }],
              mpc20Balances: [],
            },
          },
        }),
      });

      const req = new NextRequest("http://localhost:3000/api/account/balance", {
        method: "POST",
        body: JSON.stringify({ address: "0x1234" }),
        headers: { "Content-Type": "application/json" },
      });

      await POST(req);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://backend.browser.testnet.partisiablockchain.com/graphql/query",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    it("calls backend.browser.partisiablockchain.com when NEXT_PUBLIC_ENV=prod", async () => {
      process.env.NEXT_PUBLIC_ENV = "prod";
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            account: {
              displayCoins: [],
              mpc20Balances: [],
            },
          },
        }),
      });

      const req = new NextRequest("http://localhost:3000/api/account/balance", {
        method: "POST",
        body: JSON.stringify({ address: "0x1234" }),
        headers: { "Content-Type": "application/json" },
      });

      await POST(req);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://backend.browser.partisiablockchain.com/graphql/query",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    it("returns account data from backend response", async () => {
      process.env.NEXT_PUBLIC_ENV = "test";
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            account: {
              displayCoins: [
                {
                  symbol: "PARTI",
                  balance: "100.5",
                  conversionRate: "1",
                  balanceAsGas: "10",
                },
              ],
              mpc20Balances: [
                { contract: "0xabc", symbol: "USDC", balance: "50" },
              ],
            },
          },
        }),
      });

      const req = new NextRequest("http://localhost:3000/api/account/balance", {
        method: "POST",
        body: JSON.stringify({ address: "0x1234" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(req);
      const json = await response.json();

      expect(json.data.account.displayCoins).toHaveLength(1);
      expect(json.data.account.displayCoins[0].symbol).toBe("PARTI");
      expect(json.data.account.mpc20Balances).toHaveLength(1);
    });

    it("returns 500 when backend returns non-ok response", async () => {
      process.env.NEXT_PUBLIC_ENV = "test";
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      });

      const req = new NextRequest("http://localhost:3000/api/account/balance", {
        method: "POST",
        body: JSON.stringify({ address: "0x1234" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe("Browser API error");
    });

    it("returns 500 when backend throws error", async () => {
      process.env.NEXT_PUBLIC_ENV = "test";
      mockFetch.mockRejectedValueOnce(new Error("Network failure"));

      const req = new NextRequest("http://localhost:3000/api/account/balance", {
        method: "POST",
        body: JSON.stringify({ address: "0x1234" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe("Failed");
    });

    it("sends correct GraphQL query and variables to backend", async () => {
      process.env.NEXT_PUBLIC_ENV = "test";
      const expectedAddress = "0x373c68dfed999aec39063194e2d3e0870f9899fa";
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { account: { displayCoins: [], mpc20Balances: [] } },
        }),
      });

      const req = new NextRequest("http://localhost:3000/api/account/balance", {
        method: "POST",
        body: JSON.stringify({ address: expectedAddress }),
        headers: { "Content-Type": "application/json" },
      });

      await POST(req);

      const call = mockFetch.mock.calls[0];
      const callBody = JSON.parse(call[1].body);
      expect(callBody.variables.address).toBe(expectedAddress);
      expect(callBody.query).toContain("AccountSingleQuery");
      expect(callBody.query).toContain("displayCoins");
      expect(callBody.query).toContain("mpc20Balances");
    });
  });
});
