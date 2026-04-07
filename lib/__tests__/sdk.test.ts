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
        "df4642ef258f9aef2adb6c148590208b20387fb067f2c0907d6c85697c27928c";
      const { getServerSdk } = await import("../sdk");
      const sdk = getServerSdk();
      expect(sdk).toBeDefined();
    });
  });

  describe("getAccountBalance", () => {
    it("returns 0 when accountRepository is not available", async () => {
      const { getAccountBalance, metaNamesSdkFactory } = await import("../sdk");
      const sdk = metaNamesSdkFactory();
      const balance = await getAccountBalance(sdk, "0x1234", "PARTI");
      expect(balance).toBe(0);
    });

    it("returns balance when accountRepository returns a number", async () => {
      const mockSdk = {
        accountRepository: {
          getBalance: vi.fn().mockResolvedValue(100),
        },
      };
      const { getAccountBalance } = await import("../sdk");
      const balance = await getAccountBalance(
        mockSdk as unknown as Parameters<typeof getAccountBalance>[0],
        "0x1234",
        "PARTI",
      );
      expect(balance).toBe(100);
    });

    it("returns 0 when accountRepository throws error", async () => {
      const mockSdk = {
        accountRepository: {
          getBalance: vi.fn().mockRejectedValue(new Error("Network error")),
        },
      };
      const { getAccountBalance } = await import("../sdk");
      const balance = await getAccountBalance(
        mockSdk as unknown as Parameters<typeof getAccountBalance>[0],
        "0x1234",
        "PARTI",
      );
      expect(balance).toBe(0);
    });

    it("returns 0 when getBalance returns non-number", async () => {
      const mockSdk = {
        accountRepository: {
          getBalance: vi.fn().mockResolvedValue("not a number"),
        },
      };
      const { getAccountBalance } = await import("../sdk");
      const balance = await getAccountBalance(
        mockSdk as unknown as Parameters<typeof getAccountBalance>[0],
        "0x1234",
        "PARTI",
      );
      expect(balance).toBe(0);
    });
  });
});
