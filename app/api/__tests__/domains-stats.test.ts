import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

const domainRepository = {
  count: vi.fn(),
  getOwners: vi.fn(),
  getAll: vi.fn(),
};

vi.mock("@/lib/sdk", () => ({
  getServerSdk: vi.fn(() => ({ domainRepository })),
}));

describe("GET /api/domains/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses dedicated count()/getOwners() reads, not a getAll() scan for the counts", async () => {
    domainRepository.count.mockResolvedValue(42);
    domainRepository.getOwners.mockResolvedValue(["0x1", "0x2", "0x3"]);
    domainRepository.getAll.mockResolvedValue([
      { name: "a.mpc", createdAt: new Date("2026-01-02") },
      { name: "b.mpc", createdAt: new Date("2026-01-01") },
    ]);

    const { GET } = await import("../domains/stats/route");
    const response = await GET();
    const json = await response.json();

    expect(json.domainCount).toBe(42);
    expect(json.ownerCount).toBe(3);
    expect(json.recentDomains).toEqual([
      { name: "a.mpc", createdAt: "2026-01-02T00:00:00.000Z" },
      { name: "b.mpc", createdAt: "2026-01-01T00:00:00.000Z" },
    ]);
  });

  it("degrades to an empty recent list when only getAll() fails", async () => {
    domainRepository.count.mockResolvedValue(5);
    domainRepository.getOwners.mockResolvedValue(["0x1"]);
    domainRepository.getAll.mockRejectedValue(new Error("scan failed"));

    const { GET } = await import("../domains/stats/route");
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.recentDomains).toEqual([]);
    expect(json.domainCount).toBe(5);
  });

  it("returns a 500 (not a 200 with zeroed stats) when count() fails", async () => {
    domainRepository.count.mockRejectedValue(new Error("rpc down"));
    domainRepository.getOwners.mockResolvedValue([]);
    domainRepository.getAll.mockResolvedValue([]);

    const { GET } = await import("../domains/stats/route");
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Internal Server Error" });
  });

  it("sends a private max-age Cache-Control header, not a shared s-maxage", async () => {
    domainRepository.count.mockResolvedValue(0);
    domainRepository.getOwners.mockResolvedValue([]);
    domainRepository.getAll.mockResolvedValue([]);

    const { GET } = await import("../domains/stats/route");
    const response = await GET();

    expect(response.headers.get("Cache-Control")).toBe("max-age=600");
  });
});
