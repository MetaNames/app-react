import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

import {
  WATCHLIST_LIMIT,
  useWatchlistStore,
} from "@/lib/stores/watchlist-store";

beforeEach(() => {
  useWatchlistStore.setState({ names: [] });
});

describe("watchlist store", () => {
  it("starts empty", () => {
    expect(useWatchlistStore.getState().names).toEqual([]);
  });

  it("adds a name newest first", () => {
    useWatchlistStore.getState().toggle("one.mpc");
    useWatchlistStore.getState().toggle("two.mpc");

    expect(useWatchlistStore.getState().names).toEqual(["two.mpc", "one.mpc"]);
  });

  it("toggling a watched name removes it", () => {
    useWatchlistStore.getState().toggle("one.mpc");
    useWatchlistStore.getState().toggle("one.mpc");

    expect(useWatchlistStore.getState().names).toEqual([]);
  });

  it("never stores the same name twice", () => {
    useWatchlistStore.getState().toggle("one.mpc");
    useWatchlistStore.getState().toggle("two.mpc");
    useWatchlistStore.getState().toggle("one.mpc");
    useWatchlistStore.getState().toggle("one.mpc");

    expect(useWatchlistStore.getState().names).toEqual(["one.mpc", "two.mpc"]);
  });

  it("drops the oldest name past the limit", () => {
    for (let i = 0; i <= WATCHLIST_LIMIT; i++) {
      useWatchlistStore.getState().toggle(`name-${i}.mpc`);
    }

    const { names } = useWatchlistStore.getState();
    expect(names).toHaveLength(WATCHLIST_LIMIT);
    expect(names[0]).toBe(`name-${WATCHLIST_LIMIT}.mpc`);
    // The first name added is the one that falls off the end.
    expect(names).not.toContain("name-0.mpc");
  });

  it("removes a name it is not watching without disturbing the rest", () => {
    useWatchlistStore.getState().toggle("one.mpc");
    useWatchlistStore.getState().remove("other.mpc");

    expect(useWatchlistStore.getState().names).toEqual(["one.mpc"]);
  });

  it("clears the whole list", () => {
    useWatchlistStore.getState().toggle("one.mpc");
    useWatchlistStore.getState().toggle("two.mpc");
    useWatchlistStore.getState().clear();

    expect(useWatchlistStore.getState().names).toEqual([]);
  });
});

/**
 * The environment decides which storage the module picks, and it picks once at
 * import time — so each of these stubs the global and re-imports.
 */
describe("watchlist persistence", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  const stubStorage = () => {
    const items = new Map<string, string>();
    const storage = {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => void items.set(key, value),
      removeItem: (key: string) => void items.delete(key),
      clear: () => items.clear(),
      key: () => null,
      length: 0,
    };
    vi.stubGlobal("localStorage", storage);
    return items;
  };

  it("writes the names to localStorage so a reload keeps them", async () => {
    const items = stubStorage();
    vi.resetModules();
    const { useWatchlistStore: store, WATCHLIST_STORAGE_KEY } =
      await import("@/lib/stores/watchlist-store");

    store.getState().toggle("one.mpc");

    const stored = items.get(WATCHLIST_STORAGE_KEY);
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!).state).toEqual({ names: ["one.mpc"] });
  });

  it("restores the names written by a previous visit", async () => {
    const items = stubStorage();
    items.set(
      "metanames:watchlist",
      JSON.stringify({ state: { names: ["kept.mpc"] }, version: 0 }),
    );
    vi.resetModules();
    const { useWatchlistStore: store } =
      await import("@/lib/stores/watchlist-store");

    expect(store.getState().names).toEqual(["kept.mpc"]);
  });

  it("still works when the browser denies storage", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("SecurityError: access denied");
      },
    });
    vi.resetModules();
    const { useWatchlistStore: store } =
      await import("@/lib/stores/watchlist-store");

    // The list is session-only here, but nothing throws and the feature works.
    expect(() => store.getState().toggle("one.mpc")).not.toThrow();
    expect(store.getState().names).toEqual(["one.mpc"]);
  });
});
