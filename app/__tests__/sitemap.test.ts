import { describe, it, expect, vi, beforeEach } from "vitest";

const domainRepository = {
  getAll: vi.fn(),
};

vi.mock("@/lib/sdk", () => ({
  getServerSdk: vi.fn(() => ({ domainRepository })),
}));

vi.mock("@/lib/config", () => ({
  config: { websiteUrl: "https://app.metanames.app/" },
}));

function domain(name: string, createdAt: string) {
  return { name, createdAt: new Date(createdAt) };
}

describe("sitemap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("lists the home page and the TLD page even with no domains", async () => {
    domainRepository.getAll.mockResolvedValue([]);
    const { default: sitemap } = await import("../sitemap");

    expect((await sitemap()).map((e) => e.url)).toEqual([
      "https://app.metanames.app/",
      "https://app.metanames.app/tld",
    ]);
  });

  it("lists a page per domain, newest first", async () => {
    domainRepository.getAll.mockResolvedValue([
      domain("old.mpc", "2026-01-01"),
      domain("new.mpc", "2026-06-01"),
    ]);
    const { default: sitemap } = await import("../sitemap");

    expect((await sitemap()).slice(2).map((e) => e.url)).toEqual([
      "https://app.metanames.app/domain/new.mpc",
      "https://app.metanames.app/domain/old.mpc",
    ]);
  });

  // websiteUrl carries a trailing slash; a naive join would emit
  // ".../domain//new.mpc", a distinct URL as far as a crawler is concerned.
  it("does not double the slash when joining paths", async () => {
    domainRepository.getAll.mockResolvedValue([domain("a.mpc", "2026-01-01")]);
    const { default: sitemap } = await import("../sitemap");

    for (const entry of await sitemap()) {
      expect(entry.url).not.toMatch(/[^:]\/\//);
    }
  });

  // A chain read that fails must not take the whole sitemap down with it.
  it("still serves the static routes when the domain read fails", async () => {
    domainRepository.getAll.mockRejectedValue(new Error("rpc down"));
    const { default: sitemap } = await import("../sitemap");

    expect((await sitemap()).map((e) => e.url)).toEqual([
      "https://app.metanames.app/",
      "https://app.metanames.app/tld",
    ]);
  });

  it("caps the domain entries below the single-sitemap URL limit", async () => {
    domainRepository.getAll.mockResolvedValue(
      Array.from({ length: 20_005 }, (_, i) =>
        domain(`d${i}.mpc`, "2026-01-01"),
      ),
    );
    const { default: sitemap } = await import("../sitemap");

    expect((await sitemap()).length).toBe(20_002);
  });
});

describe("robots", () => {
  it("keeps crawlers off the API and owner-only routes", async () => {
    const { default: robots } = await import("../robots");
    const rules = robots().rules as { disallow: string[]; allow: string };

    expect(rules.allow).toBe("/");
    expect(rules.disallow).toContain("/api/");
    expect(rules.disallow).toContain("/profile");
  });

  it("points at the sitemap", async () => {
    const { default: robots } = await import("../robots");
    expect(robots().sitemap).toBe("https://app.metanames.app/sitemap.xml");
  });
});
