import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

const domainRepository = {
  getAll: vi.fn(),
};

vi.mock("@/lib/sdk", () => ({
  getServerSdk: vi.fn(() => ({ domainRepository })),
}));

describe("GET /api/domains/recent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a {name, createdAt} projection, not full Domain objects", async () => {
    domainRepository.getAll.mockResolvedValue([
      { name: "a.mpc", createdAt: new Date("2026-01-01"), owner: "0xabc" },
    ]);

    const { GET } = await import("../domains/recent/route");
    const response = await GET();
    const json = await response.json();

    expect(json).toEqual([
      { name: "a.mpc", createdAt: "2026-01-01T00:00:00.000Z" },
    ]);
    expect(json[0].owner).toBeUndefined();
  });

  it("caps recent domains at 12, matching legacy (not 10)", async () => {
    const domains = Array.from({ length: 20 }, (_, i) => ({
      name: `d${i}.mpc`,
      createdAt: new Date(2026, 0, i + 1),
    }));
    domainRepository.getAll.mockResolvedValue(domains);

    const { GET } = await import("../domains/recent/route");
    const response = await GET();
    const json = await response.json();

    expect(json).toHaveLength(12);
  });

  it("sends a private max-age Cache-Control header", async () => {
    domainRepository.getAll.mockResolvedValue([]);

    const { GET } = await import("../domains/recent/route");
    const response = await GET();

    expect(response.headers.get("Cache-Control")).toBe("max-age=600, public");
  });

  it("returns 200 with an empty list, not a 500, when getAll() fails", async () => {
    domainRepository.getAll.mockRejectedValue(new Error("rpc down"));

    const { GET } = await import("../domains/recent/route");
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual([]);
  });
});
