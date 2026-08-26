import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DomainStats } from "../domain-stats";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("DomainStats", () => {
  beforeEach(() => vi.resetAllMocks());

  it("renders counts from the stats API", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        domainCount: 1204,
        ownerCount: 486,
        recentDomains: [],
      }),
    });
    render(<DomainStats />);
    await waitFor(() => expect(screen.getByText(/1,204/)).toBeInTheDocument(), {
      timeout: 2000,
    });
    expect(screen.getByText(/486/)).toBeInTheDocument();
    expect(screen.getByText("DOMAINS")).toBeInTheDocument();
    expect(screen.getByText("OWNERS")).toBeInTheDocument();
  });

  it("renders nothing on error", async () => {
    mockFetch.mockImplementation(() => Promise.reject(new Error("network")));
    const { container } = render(<DomainStats />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
