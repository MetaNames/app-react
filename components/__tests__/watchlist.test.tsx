import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import { WatchButton } from "../watch-button";
import { WatchlistSection } from "../watchlist";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";

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

beforeEach(() => useWatchlistStore.setState({ names: [] }));
afterEach(cleanup);

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
