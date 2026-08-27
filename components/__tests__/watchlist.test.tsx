import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";

import { WatchButton } from "../watch-button";
import { WatchlistSection } from "../watchlist";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";

// The avatar reaches for jdenticon, which refuses to draw outside a browser;
// the identicon is not what these tests are about.
vi.mock("../domain-avatar", () => ({
  JdenticonAvatar: () => <svg data-testid="avatar" />,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

/** The list looks every watched name up; unless a test says otherwise, the
 *  chain answers "registered, no expiry", which shows no badge. */
const mockLookup = (
  byName: Record<string, { expiresAt?: string | null } | null> = {},
) =>
  vi.fn(async (url: string) => {
    const name = decodeURIComponent(url.split("/").pop()!);
    const domain = name in byName ? byName[name] : { name, expiresAt: null };
    return { ok: true, json: async () => ({ domain }) } as Response;
  });

beforeEach(() => {
  useWatchlistStore.setState({ names: [] });
  vi.stubGlobal("fetch", mockLookup());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("WatchButton", () => {
  it("adds the name to the watchlist", () => {
    render(<WatchButton name="one.mpc" />);

    fireEvent.click(screen.getByRole("button", { name: "Watch one.mpc" }));

    expect(useWatchlistStore.getState().names).toEqual(["one.mpc"]);
  });

  it("reflects a name that is already watched", () => {
    useWatchlistStore.setState({ names: ["one.mpc"] });
    render(<WatchButton name="one.mpc" />);

    const button = screen.getByRole("button", {
      name: "Stop watching one.mpc",
    });
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("removes the name on a second press", () => {
    useWatchlistStore.setState({ names: ["one.mpc"] });
    render(<WatchButton name="one.mpc" />);

    fireEvent.click(screen.getByTestId("watch-button"));

    expect(useWatchlistStore.getState().names).toEqual([]);
  });

  it("is not pressed for a name that is not watched", () => {
    useWatchlistStore.setState({ names: ["other.mpc"] });
    render(<WatchButton name="one.mpc" />);

    expect(screen.getByTestId("watch-button")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});

describe("WatchlistSection", () => {
  it("explains how to add a name when the list is empty", () => {
    render(<WatchlistSection />);

    expect(screen.getByTestId("watchlist-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("watchlist")).not.toBeInTheDocument();
  });

  it("links each watched name to its domain page", () => {
    useWatchlistStore.setState({ names: ["one.mpc", "two.mpc"] });
    render(<WatchlistSection />);

    expect(screen.getByRole("link", { name: "one.mpc" })).toHaveAttribute(
      "href",
      "/domain/one.mpc",
    );
    expect(screen.getByRole("link", { name: "two.mpc" })).toHaveAttribute(
      "href",
      "/domain/two.mpc",
    );
  });

  it("drops a name when its remove button is pressed", () => {
    useWatchlistStore.setState({ names: ["one.mpc", "two.mpc"] });
    render(<WatchlistSection />);

    fireEvent.click(
      screen.getByRole("button", { name: "Stop watching one.mpc" }),
    );

    expect(useWatchlistStore.getState().names).toEqual(["two.mpc"]);
    expect(screen.queryByRole("link", { name: "one.mpc" })).toBeNull();
  });

  it("counts the watched names", () => {
    useWatchlistStore.setState({ names: ["one.mpc", "two.mpc"] });
    render(<WatchlistSection />);

    expect(screen.getByText("2")).toBeInTheDocument();
  });
});

describe("watched name status", () => {
  it("marks a name that is free to register and links to registration", async () => {
    vi.stubGlobal("fetch", mockLookup({ "one.mpc": null }));
    useWatchlistStore.setState({ names: ["one.mpc"] });
    render(<WatchlistSection />);

    await waitFor(() =>
      expect(screen.getByText("Available")).toBeInTheDocument(),
    );
    expect(screen.getByRole("link", { name: "one.mpc" })).toHaveAttribute(
      "href",
      "/register/one.mpc",
    );
  });

  it("warns when a watched name is close to expiry", async () => {
    const soon = new Date(Date.now() + 5 * 86_400_000).toISOString();
    vi.stubGlobal("fetch", mockLookup({ "one.mpc": { expiresAt: soon } }));
    useWatchlistStore.setState({ names: ["one.mpc"] });
    render(<WatchlistSection />);

    await waitFor(() =>
      expect(screen.getByText("Expires in 5 days")).toBeInTheDocument(),
    );
  });

  it("stays quiet about a name whose expiry is far off", async () => {
    const later = new Date(Date.now() + 200 * 86_400_000).toISOString();
    vi.stubGlobal("fetch", mockLookup({ "one.mpc": { expiresAt: later } }));
    useWatchlistStore.setState({ names: ["one.mpc"] });
    render(<WatchlistSection />);

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "one.mpc" })).toBeInTheDocument(),
    );
    expect(screen.queryByText(/Expires/)).toBeNull();
    expect(screen.queryByText("Available")).toBeNull();
  });

  it("renders the name even when its lookup fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    useWatchlistStore.setState({ names: ["one.mpc"] });
    render(<WatchlistSection />);

    expect(screen.getByRole("link", { name: "one.mpc" })).toHaveAttribute(
      "href",
      "/domain/one.mpc",
    );
  });

  it("caps how many names it looks up", async () => {
    const fetchMock = mockLookup();
    vi.stubGlobal("fetch", fetchMock);
    useWatchlistStore.setState({
      names: Array.from({ length: 40 }, (_, i) => `name-${i}.mpc`),
    });
    render(<WatchlistSection />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    // 100 watched names must not mean 100 chain reads on every profile visit.
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(25);
    expect(screen.getAllByRole("link")).toHaveLength(40);
  });
});
