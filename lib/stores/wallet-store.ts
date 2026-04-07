import { create } from "zustand";
import type { AlertMessage } from "../types";
interface WalletStore {
  address: string | undefined;
  alertMessage: AlertMessage | undefined;
  alertTransaction: string | undefined;
  lastRefreshed: number | null;
  setAddress: (a: string | undefined) => void;
  setAlertMessage: (m: AlertMessage | undefined) => void;
  setAlertTransaction: (tx: string | undefined) => void;
  triggerRefresh: () => void;
}
export const useWalletStore = create<WalletStore>((set) => ({
  address: undefined,
  alertMessage: undefined,
  alertTransaction: undefined,
  lastRefreshed: null,
  setAddress: (address) => set({ address }),
  setAlertMessage: (alertMessage) => set({ alertMessage }),
  setAlertTransaction: (alertTransaction) => set({ alertTransaction }),
  triggerRefresh: () => set({ lastRefreshed: Date.now() }),
}));
