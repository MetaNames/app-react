import { create } from "zustand";
import type { AlertMessage } from "../types";

/**
 * Wallet store - intentionally mixes wallet state with temporary UI state.
 *
 * Concerns:
 * - address: wallet connection state (persisted across app)
 * - alertMessage: temporary UI state for toast notifications (component-local would also work)
 * - lastRefreshed: refresh trigger for data re-fetching (shared across components)
 *
 * Splitting is unnecessary for this app's scale. If complexity grows, consider moving
 * alertMessage to local component state or a dedicated ui-store.
 */
interface WalletStore {
  address: string | undefined;
  alertMessage: AlertMessage | undefined;
  lastRefreshed: number | null;
  setAddress: (a: string | undefined) => void;
  setAlertMessage: (m: AlertMessage | undefined) => void;
  triggerRefresh: () => void;
}
export const useWalletStore = create<WalletStore>((set) => ({
  address: undefined,
  alertMessage: undefined,
  lastRefreshed: null,
  setAddress: (address) => set({ address }),
  setAlertMessage: (alertMessage) => set({ alertMessage }),
  triggerRefresh: () => set({ lastRefreshed: Date.now() }),
}));
