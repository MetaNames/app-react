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

  it("renders nothing on error and does not leak an unhandled rejection", async () => {
    const onUnhandledRejection = vi.fn();
    process.on("unhandledRejection", onUnhandledRejection);
    try {
      mockFetch.mockImplementation(() => Promise.reject(new Error("network")));
      const { container } = render(<DomainStats />);
      await waitFor(() => expect(mockFetch).toHaveBeenCalled());
      // Flush the microtask queue so the rejection has a chance to propagate
      // if it were not actually caught by the component.
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(container).toBeEmptyDOMElement();
      expect(onUnhandledRejection).not.toHaveBeenCalled();
    } finally {
      process.off("unhandledRejection", onUnhandledRejection);
    }
  });

  it("hides the stats block when the API returns a zeroed response", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ domainCount: 0, ownerCount: 0, recentDomains: [] }),
    });
    const { container } = render(<DomainStats />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container).toBeEmptyDOMElement();
  });
});
