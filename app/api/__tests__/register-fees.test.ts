import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

const domainRepository = { calculateMintFees: vi.fn() };
const config = {
  byoc: [{ symbol: "TEST_COIN" }, { symbol: "ETH_GOERLI" }],
};

vi.mock("@/lib/sdk", () => ({
  getServerSdk: vi.fn(() => ({ domainRepository, config })),
}));

async function callFees(name: string, coin: string) {
  const { GET } = await import("../register/[name]/fees/[coin]/route");
  const req = new NextRequest(
    `http://localhost:3000/api/register/${name}/fees/${coin}`,
  );
  const response = await GET(req, {
    params: Promise.resolve({ name, coin }),
  });
  return { response, json: await response.json() };
}

describe("GET /api/register/[name]/fees/[coin]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns the fee projection for a supported coin", async () => {
    domainRepository.calculateMintFees.mockResolvedValue({
      feesLabel: 10,
      fees: "0a",
      symbol: "TEST_COIN",
      address: "01ab",
    });

    const { response, json } = await callFees("alice.mpc", "TEST_COIN");

    expect(response.status).toBe(200);
    expect(json).toEqual({
      feesLabel: 10,
      fees: "0a",
      symbol: "TEST_COIN",
      address: "01ab",
    });
  });

  it("rejects a name that exceeds the SDK's length cap with a 400", async () => {
    const { response, json } = await callFees("a".repeat(29), "TEST_COIN");

    expect(response.status).toBe(400);
    expect(json.error).toBe("Domain name must be at most 28 characters");
    expect(domainRepository.calculateMintFees).not.toHaveBeenCalled();
  });

  it("rejects a structurally invalid name with a 400", async () => {
    const { response, json } = await callFees("UPPER", "TEST_COIN");

    expect(response.status).toBe(400);
    expect(json.error).toBe(
      "Only lowercase letters, numbers, and hyphens allowed",
    );
    expect(domainRepository.calculateMintFees).not.toHaveBeenCalled();
  });

  it("rejects a coin the environment does not expose", async () => {
    // "ETH" is a mainnet symbol; testnet exposes ETH_GOERLI instead.
    const { response, json } = await callFees("alice.mpc", "ETH");

    expect(response.status).toBe(400);
    expect(json.error).toBe("Unsupported coin symbol");
    expect(domainRepository.calculateMintFees).not.toHaveBeenCalled();
  });

  it("never leaks the raw exception message, and reports it to Sentry", async () => {
    domainRepository.calculateMintFees.mockRejectedValue(
      new Error("connect ECONNREFUSED 10.0.0.7:8080"),
    );

    const { response, json } = await callFees("alice.mpc", "TEST_COIN");

    expect(response.status).toBe(500);
    expect(json.error).toBe("Internal Server Error");
    expect(JSON.stringify(json)).not.toContain("ECONNREFUSED");
    expect(Sentry.captureException).toHaveBeenCalled();
  });

  it("returns 404 when the SDK reports no fees for the domain", async () => {
    domainRepository.calculateMintFees.mockResolvedValue(null);

    const { response, json } = await callFees("alice.mpc", "TEST_COIN");

    expect(response.status).toBe(404);
    expect(json.error).toBe("Not found");
  });
});
