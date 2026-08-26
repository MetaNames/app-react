import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

const domainRepository = {
  analyze: vi.fn(),
  find: vi.fn(),
};

vi.mock("@/lib/sdk", () => ({
  getServerSdk: vi.fn(() => ({ domainRepository })),
}));

async function callCheck(name: string) {
  const { GET } = await import("../domains/[name]/check/route");
  const req = new NextRequest(`http://localhost:3000/api/domains/${name}/check`);
  const response = await GET(req, { params: Promise.resolve({ name }) });
  return { response, json: await response.json() };
}

describe("GET /api/domains/[name]/check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes the name straight through, without appending .mpc", async () => {
    domainRepository.analyze.mockReturnValue({ parentId: undefined, tld: "mpc" });
    domainRepository.find.mockResolvedValue(null);

    await callCheck("alice");

    expect(domainRepository.find).toHaveBeenCalledWith("alice");
  });

  it("uses analyze() for parent resolution instead of hand-splitting on '.'", async () => {
    domainRepository.analyze.mockReturnValue({ parentId: "bob.mpc", tld: "mpc" });
    domainRepository.find
      .mockResolvedValueOnce(null) // sub.bob.mpc not found
      .mockResolvedValueOnce({ name: "bob.mpc" }); // parent found

    const { json } = await callCheck("sub.bob.mpc");

    expect(domainRepository.analyze).toHaveBeenCalledWith("sub.bob.mpc");
    expect(domainRepository.find).toHaveBeenNthCalledWith(2, "bob.mpc");
    expect(json).toEqual({ domainPresent: false, parentPresent: true });
  });

  it("skips the parent lookup once the domain itself is found", async () => {
    domainRepository.analyze.mockReturnValue({ parentId: "bob.mpc", tld: "mpc" });
    domainRepository.find.mockResolvedValueOnce({ name: "sub.bob.mpc" });

    const { json } = await callCheck("sub.bob.mpc");

    expect(domainRepository.find).toHaveBeenCalledTimes(1);
    expect(json).toEqual({ domainPresent: true, parentPresent: false });
  });

  it("skips the parent lookup when the parent segment is the TLD itself", async () => {
    domainRepository.analyze.mockReturnValue({ parentId: "mpc", tld: "mpc" });
    domainRepository.find.mockResolvedValueOnce(null);

    const { json } = await callCheck("alice.mpc");

    expect(domainRepository.find).toHaveBeenCalledTimes(1);
    expect(json).toEqual({ domainPresent: false, parentPresent: false });
  });

  it("returns a generic 500 when the lookup throws", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    domainRepository.analyze.mockReturnValue({ parentId: undefined, tld: "mpc" });
    domainRepository.find.mockRejectedValue(new Error("secret rpc detail"));

    const { response, json } = await callCheck("alice");

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Internal Server Error" });

    consoleError.mockRestore();
  });
});
