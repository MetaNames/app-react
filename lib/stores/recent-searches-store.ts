import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { browserStorage } from "./browser-storage";

/**
 * Names this browser has looked up, newest first.
 *
 * A lookup is the one thing every visitor does, and today it leaves no trace:
 * close the tab and the name you were weighing up is gone, with nothing to
 * type back but memory. Recording the last few turns the home page into a way
 * back to what you were already considering.
 *
 * Local to the browser for the same reason as the watchlist: a search history
 * tied to an address is a privacy cost that buys the user nothing.
 */
interface RecentSearchesStore {
  names: string[];
  record: (name: string) => void;
  clear: () => void;
}

/** Enough to recognise what you were doing, few enough to fit on one row. */
export const RECENT_SEARCHES_LIMIT = 6;

export const RECENT_SEARCHES_STORAGE_KEY = "metanames:recent-searches";

export const useRecentSearchesStore = create<RecentSearchesStore>()(
  persist(
    (set) => ({
      names: [],
      record: (name) =>
        set((state) => {
          const trimmed = name.trim().toLowerCase();
          if (!trimmed) return state;
          // Searching the same name twice should move it to the front, not
          // fill the row with copies of itself.
          const rest = state.names.filter((n) => n !== trimmed);
          return { names: [trimmed, ...rest].slice(0, RECENT_SEARCHES_LIMIT) };
        }),
      clear: () => set({ names: [] }),
    }),
    {
      name: RECENT_SEARCHES_STORAGE_KEY,
      storage: createJSONStorage(() =>
        browserStorage(RECENT_SEARCHES_STORAGE_KEY),
      ),
      partialize: (state) => ({ names: state.names }),
    },
  ),
);

/** Stable identity so the hydration snapshot never looks like a new value. */
const NO_NAMES: readonly string[] = Object.freeze([]);

/**
 * The recent searches, safe to render on the server.
 *
 * Same reasoning as the watchlist: the list comes from localStorage, which the
 * server cannot see, so the hydration render reads an empty server snapshot
 * and only then switches to the stored one.
 */
export function useRecentSearches(): readonly string[] {
  return useSyncExternalStore(
    useRecentSearchesStore.subscribe,
    () => useRecentSearchesStore.getState().names,
    () => NO_NAMES,
  );
}
