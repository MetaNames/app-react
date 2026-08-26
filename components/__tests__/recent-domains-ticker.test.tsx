import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { RecentDomainsTicker } from "../recent-domains-ticker";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("RecentDomainsTicker", () => {
  beforeEach(() => vi.resetAllMocks());

  it("renders nothing while loading, then shows domains once the fetch resolves", async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const { container } = render(<RecentDomainsTicker />);
    expect(container).toBeEmptyDOMElement();

    resolveFetch({
      ok: true,
      json: async () => [{ name: "alice.mpc" }],
    });

    await waitFor(() =>
      expect(screen.getByText("alice.mpc")).toBeInTheDocument(),
    );
  });

  it("renders fetched domain pills", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ name: "alice.mpc" }, { name: "bob.mpc" }],
    });
    render(<RecentDomainsTicker />);
    await waitFor(() =>
      expect(screen.getByText("alice.mpc")).toBeInTheDocument(),
    );
    expect(screen.getByText("bob.mpc")).toBeInTheDocument();
  });

  it("renders nothing on fetch error and does not leak an unhandled rejection", async () => {
    const onUnhandledRejection = vi.fn();
    process.on("unhandledRejection", onUnhandledRejection);
    try {
      mockFetch.mockImplementation(() => Promise.reject(new Error("network")));
      const { container } = render(<RecentDomainsTicker />);
      await waitFor(() => expect(mockFetch).toHaveBeenCalled());
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(container).toBeEmptyDOMElement();
      expect(onUnhandledRejection).not.toHaveBeenCalled();
    } finally {
      process.off("unhandledRejection", onUnhandledRejection);
    }
  });
});
