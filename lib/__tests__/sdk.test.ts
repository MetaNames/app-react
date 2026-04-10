import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("lib/sdk", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  describe("metaNamesSdkFactory", () => {
    it("creates SDK with testnet environment when NEXT_PUBLIC_ENV is not set", async () => {
      delete process.env.NEXT_PUBLIC_ENV;
      const { metaNamesSdkFactory } = await import("../sdk");
      const sdk = metaNamesSdkFactory();
      expect(sdk).toBeDefined();
    });

    it("creates SDK with testnet environment when NEXT_PUBLIC_ENV=test", async () => {
      process.env.NEXT_PUBLIC_ENV = "test";
      const { metaNamesSdkFactory } = await import("../sdk");
      const sdk = metaNamesSdkFactory();
      expect(sdk).toBeDefined();
    });

    it("creates SDK with mainnet environment when NEXT_PUBLIC_ENV=prod", async () => {
      process.env.NEXT_PUBLIC_ENV = "prod";
      const { metaNamesSdkFactory } = await import("../sdk");
      const sdk = metaNamesSdkFactory();
      expect(sdk).toBeDefined();
    });
  });

  describe("getServerSdk", () => {
    it("creates SDK with testnet when NEXT_PUBLIC_ENV is not set", async () => {
      delete process.env.NEXT_PUBLIC_ENV;
      delete process.env.TESTNET_PRIVATE_KEY;
      const { getServerSdk } = await import("../sdk");
      const sdk = getServerSdk();
      expect(sdk).toBeDefined();
    });

    it("creates SDK with testnet when NEXT_PUBLIC_ENV=test", async () => {
      process.env.NEXT_PUBLIC_ENV = "test";
      delete process.env.TESTNET_PRIVATE_KEY;
      const { getServerSdk } = await import("../sdk");
      const sdk = getServerSdk();
      expect(sdk).toBeDefined();
    });

    it("creates SDK with mainnet when NEXT_PUBLIC_ENV=prod", async () => {
      process.env.NEXT_PUBLIC_ENV = "prod";
      delete process.env.TESTNET_PRIVATE_KEY;
      const { getServerSdk } = await import("../sdk");
      const sdk = getServerSdk();
      expect(sdk).toBeDefined();
    });

    it("sets signing strategy when TESTNET_PRIVATE_KEY is provided", async () => {
      process.env.NEXT_PUBLIC_ENV = "test";
      process.env.TESTNET_PRIVATE_KEY =
        "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
      const { getServerSdk } = await import("../sdk");
      const sdk = getServerSdk();
      expect(sdk).toBeDefined();
    });
  });

  describe("getAccountBalance", () => {
    it("returns account data with displayCoins and mpc20Balances", async () => {
      process.env.NEXT_PUBLIC_ENV = "test";
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
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
                mpc20Balances: [],
              },
            },
          }),
        }),
      );

      const { getAccountBalance } = await import("../sdk");
      const result = await getAccountBalance("0x1234");
      expect(result.displayCoins).toHaveLength(1);
      expect(result.displayCoins[0].symbol).toBe("PARTI");
      expect(result.displayCoins[0].balance).toBe("100.5");
    });

    it("returns empty arrays when account has no coins", async () => {
      process.env.NEXT_PUBLIC_ENV = "test";
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            data: {
              account: {
                displayCoins: [],
                mpc20Balances: [],
              },
            },
          }),
        }),
      );

      const { getAccountBalance } = await import("../sdk");
      const result = await getAccountBalance("0x1234");
      expect(result.displayCoins).toHaveLength(0);
      expect(result.mpc20Balances).toHaveLength(0);
    });

    it("throws error when fetch fails", async () => {
      process.env.NEXT_PUBLIC_ENV = "test";
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("Network error")),
      );

      const { getAccountBalance } = await import("../sdk");
      await expect(getAccountBalance("0x1234")).rejects.toThrow(
        "Network error",
      );
    });
  });

  describe("getAccountBalanceForCoin", () => {
    it("returns balance for specific coin", async () => {
      process.env.NEXT_PUBLIC_ENV = "test";
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
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
                  {
                    symbol: "USDC",
                    balance: "50",
                    conversionRate: "1",
                    balanceAsGas: "0",
                  },
                ],
                mpc20Balances: [],
              },
            },
          }),
        }),
      );

      const { getAccountBalanceForCoin } = await import("../sdk");
      const balance = await getAccountBalanceForCoin("0x1234", "PARTI");
      expect(balance).toBe(100.5);
    });

    it("returns 0 when coin not found", async () => {
      process.env.NEXT_PUBLIC_ENV = "test";
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
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
                mpc20Balances: [],
              },
            },
          }),
        }),
      );

      const { getAccountBalanceForCoin } = await import("../sdk");
      const balance = await getAccountBalanceForCoin("0x1234", "USDC");
      expect(balance).toBe(0);
    });
  });
});
