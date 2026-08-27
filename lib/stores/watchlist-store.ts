import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { browserStorage } from "./browser-storage";

/**
 * Names the user wants to keep an eye on.
 *
 * A domain someone else owns is invisible in this app once you navigate away:
 * the profile only lists what the connected wallet holds, so a name you are
 * waiting to expire has nowhere to live. The watchlist is that place.
 *
 * It is deliberately local to the browser. Storing it server-side would mean
 * tying a list of interests to a wallet address, which is a privacy cost for a
 * convenience feature, and the list is worthless to anyone but its owner.
 */
interface WatchlistStore {
  names: string[];
  toggle: (name: string) => void;
  remove: (name: string) => void;
  clear: () => void;
}

/** Guards the list against unbounded growth from a stuck loop or a script. */
export const WATCHLIST_LIMIT = 100;

export const WATCHLIST_STORAGE_KEY = "metanames:watchlist";

export const useWatchlistStore = create<WatchlistStore>()(
  persist(
    (set) => ({
      names: [],
      toggle: (name) =>
        set((state) => {
          if (state.names.includes(name)) {
            return { names: state.names.filter((n) => n !== name) };
          }
          // Newest first: the name just added is the one the user is thinking
          // about, and the oldest is the one to drop at the limit.
          return { names: [name, ...state.names].slice(0, WATCHLIST_LIMIT) };
        }),
      remove: (name) =>
        set((state) => ({ names: state.names.filter((n) => n !== name) })),
      clear: () => set({ names: [] }),
    }),
    {
      name: WATCHLIST_STORAGE_KEY,
      storage: createJSONStorage(() => browserStorage(WATCHLIST_STORAGE_KEY)),
      // Only the list is worth persisting; the actions are rebuilt on every
      // load and a persisted copy of them would be dead weight.
      partialize: (state) => ({ names: state.names }),
    },
  ),
);

/** Stable identity so the hydration snapshot never looks like a new value. */
const NO_NAMES: readonly string[] = Object.freeze([]);

/**
 * The watched names, safe to render on the server.
 *
 * The list is restored from localStorage, which the server cannot see. Reading
 * the store directly would make the first client render disagree with the
 * server's markup and React would throw the tree away. `useSyncExternalStore`
 * takes a separate server snapshot — an empty list — for the hydration render
 * only, then switches to the real one, which is the same "empty until mounted"
 * behaviour without a state update inside an effect.
 */
export function useWatchedNames(): readonly string[] {
  return useSyncExternalStore(
    useWatchlistStore.subscribe,
    () => useWatchlistStore.getState().names,
    () => NO_NAMES,
  );
}
