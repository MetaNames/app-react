import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";
import { NextRequest } from "next/server";

let calculateMintFeesMock: ReturnType<typeof vi.fn>;

vi.mock("@/lib/domain-validator", () => ({
  validateDomainName: vi.fn(),
}));

vi.mock("@metanames/sdk", () => {
  const MockMetaNamesSdk = function () {
    return {
      config: {
        byoc: [{ symbol: "TEST_COIN", address: "0x123" }],
      },
      domainRepository: {
        calculateMintFees: calculateMintFeesMock,
      },
    };
  };
  return {
    MetaNamesSdk: MockMetaNamesSdk,
    Enviroment: { testnet: "testnet", mainnet: "mainnet" },
  };
});

describe("app/api/register/[name]/fees/[coin]/route", () => {
  beforeEach(() => {
    calculateMintFeesMock = vi.fn();
    vi.resetModules();
  });

  describe("GET", () => {
    it("returns 400 when domain name is too long", async () => {
      const { validateDomainName } = await import("@/lib/domain-validator");
      vi.mocked(validateDomainName).mockReturnValueOnce({
        valid: false,
        error: "Domain name must be less than 64 characters",
      });

      const req = new NextRequest(
        "http://localhost:3000/api/register/toolongdomainname12345678901234567890123456789012345678901234567890/fees/TEST_COIN",
      );

      const response = await GET(req, {
        params: Promise.resolve({
          name: "toolongdomainname12345678901234567890123456789012345678901234567890",
          coin: "TEST_COIN",
        }),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("Domain name must be less than 64 characters");
    });

    it("returns 400 when domain name is invalid", async () => {
      const { validateDomainName } = await import("@/lib/domain-validator");
      vi.mocked(validateDomainName).mockReturnValueOnce({
        valid: false,
        error: "Domain part must be 1-32 characters",
      });

      const req = new NextRequest(
        "http://localhost:3000/api/register/a/fees/TEST_COIN",
      );

      const response = await GET(req, {
        params: Promise.resolve({
          name: "a",
          coin: "TEST_COIN",
        }),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("Domain part must be 1-32 characters");
    });

    it("returns 400 when coin is not supported", async () => {
      const { validateDomainName } = await import("@/lib/domain-validator");
      vi.mocked(validateDomainName).mockReturnValueOnce({ valid: true });

      calculateMintFeesMock.mockResolvedValue({
        feesLabel: "1",
        fees: 1,
        symbol: "ETH_GOERLI",
        address: "0x123",
      });

      const req = new NextRequest(
        "http://localhost:3000/api/register/test.mpc/fees/UNSUPPORTED_COIN",
      );

      const response = await GET(req, {
        params: Promise.resolve({
          name: "test.mpc",
          coin: "UNSUPPORTED_COIN",
        }),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("Unsupported coin symbol");
    });

    it("returns 400 when SDK throws domain too long error", async () => {
      const { validateDomainName } = await import("@/lib/domain-validator");
      vi.mocked(validateDomainName).mockReturnValueOnce({ valid: true });

      calculateMintFeesMock.mockRejectedValueOnce(
        new Error("Domain name is too long"),
      );

      const req = new NextRequest(
        "http://localhost:3000/api/register/test.mpc/fees/TEST_COIN",
      );

      const response = await GET(req, {
        params: Promise.resolve({
          name: "test.mpc",
          coin: "TEST_COIN",
        }),
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("Domain name is too long");
    });
  });
});
