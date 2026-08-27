import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import {
  RECENT_SEARCHES_LIMIT,
  useRecentSearchesStore,
} from "@/lib/stores/recent-searches-store";

beforeEach(() => {
  useRecentSearchesStore.setState({ names: [] });
});

describe("recent searches store", () => {
  it("starts empty", () => {
    expect(useRecentSearchesStore.getState().names).toEqual([]);
  });

  it("records newest first", () => {
    useRecentSearchesStore.getState().record("one.mpc");
    useRecentSearchesStore.getState().record("two.mpc");

    expect(useRecentSearchesStore.getState().names).toEqual([
      "two.mpc",
      "one.mpc",
    ]);
  });

  it("moves a repeated search to the front instead of duplicating it", () => {
    useRecentSearchesStore.getState().record("one.mpc");
    useRecentSearchesStore.getState().record("two.mpc");
    useRecentSearchesStore.getState().record("one.mpc");

    expect(useRecentSearchesStore.getState().names).toEqual([
      "one.mpc",
      "two.mpc",
    ]);
  });

  it("normalises case and surrounding space so one name has one entry", () => {
    useRecentSearchesStore.getState().record("  One.MPC  ");
    useRecentSearchesStore.getState().record("one.mpc");

    expect(useRecentSearchesStore.getState().names).toEqual(["one.mpc"]);
  });

  it("ignores an empty name", () => {
    useRecentSearchesStore.getState().record("   ");

    expect(useRecentSearchesStore.getState().names).toEqual([]);
  });

  it("drops the oldest name past the limit", () => {
    for (let i = 0; i <= RECENT_SEARCHES_LIMIT; i++) {
      useRecentSearchesStore.getState().record(`name-${i}.mpc`);
    }

    const { names } = useRecentSearchesStore.getState();
    expect(names).toHaveLength(RECENT_SEARCHES_LIMIT);
    expect(names[0]).toBe(`name-${RECENT_SEARCHES_LIMIT}.mpc`);
    expect(names).not.toContain("name-0.mpc");
  });

  it("clears the whole list", () => {
    useRecentSearchesStore.getState().record("one.mpc");
    useRecentSearchesStore.getState().clear();

    expect(useRecentSearchesStore.getState().names).toEqual([]);
  });
});

/**
 * The environment decides which storage the module picks, and it picks once at
 * import time — so each of these stubs the global and re-imports.
 */
describe("recent searches persistence", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("writes the names so a reload keeps them", async () => {
    const items = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => void items.set(key, value),
      removeItem: (key: string) => void items.delete(key),
      clear: () => items.clear(),
      key: () => null,
      length: 0,
    });
    vi.resetModules();
    const { useRecentSearchesStore: store, RECENT_SEARCHES_STORAGE_KEY } =
      await import("@/lib/stores/recent-searches-store");

    store.getState().record("one.mpc");

    const stored = items.get(RECENT_SEARCHES_STORAGE_KEY);
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!).state).toEqual({ names: ["one.mpc"] });
  });

  it("restores the names written by a previous visit", async () => {
    const items = new Map<string, string>([
      [
        "metanames:recent-searches",
        JSON.stringify({ state: { names: ["kept.mpc"] }, version: 0 }),
      ],
    ]);
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => void items.set(key, value),
      removeItem: (key: string) => void items.delete(key),
      clear: () => items.clear(),
      key: () => null,
      length: 0,
    });
    vi.resetModules();
    const { useRecentSearchesStore: store } =
      await import("@/lib/stores/recent-searches-store");

    expect(store.getState().names).toEqual(["kept.mpc"]);
  });

  it("still works when the browser denies storage", async () => {
    vi.stubGlobal("localStorage", {
      get getItem(): never {
        throw new Error("denied");
      },
    });
    vi.resetModules();
    const { useRecentSearchesStore: store } =
      await import("@/lib/stores/recent-searches-store");

    expect(() => store.getState().record("one.mpc")).not.toThrow();
    expect(store.getState().names).toEqual(["one.mpc"]);
  });
});
