import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

const domainRepository = {
  find: vi.fn(),
};

vi.mock("@/lib/sdk", () => ({
  getServerSdk: vi.fn(() => ({ domainRepository })),
}));

describe("GET /api/domains/[name]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes the name straight through, without appending .mpc", async () => {
    domainRepository.find.mockResolvedValue(null);

    const { GET } = await import("../domains/[name]/route");
    const req = new NextRequest("http://localhost:3000/api/domains/alice");
    await GET(req, { params: Promise.resolve({ name: "alice" }) });

    expect(domainRepository.find).toHaveBeenCalledWith("alice");
  });

  it("returns the found domain", async () => {
    domainRepository.find.mockResolvedValue({
      name: "alice.mpc",
      owner: "0x1",
    });

    const { GET } = await import("../domains/[name]/route");
    const req = new NextRequest("http://localhost:3000/api/domains/alice.mpc");
    const response = await GET(req, {
      params: Promise.resolve({ name: "alice.mpc" }),
    });
    const json = await response.json();

    expect(json.domain).toEqual({ name: "alice.mpc", owner: "0x1" });
  });

  it("returns a generic 500 (no leaked error message) when find() throws", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    domainRepository.find.mockRejectedValue(new Error("secret rpc detail"));

    const { GET } = await import("../domains/[name]/route");
    const req = new NextRequest("http://localhost:3000/api/domains/alice");
    const response = await GET(req, {
      params: Promise.resolve({ name: "alice" }),
    });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Internal Server Error" });

    consoleError.mockRestore();
  });
});
