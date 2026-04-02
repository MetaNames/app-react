import { create } from 'zustand';
import type { AlertMessage } from '../types';
interface WalletStore {
  address: string | undefined;
  alertMessage: string | AlertMessage | undefined;
  alertTransaction: string | undefined;
  refresh: boolean;
  setAddress: (a: string | undefined) => void;
  setAlertMessage: (m: string | AlertMessage | undefined) => void;
  setAlertTransaction: (tx: string | undefined) => void;
  setRefresh: (v: boolean) => void;
}
export const useWalletStore = create<WalletStore>((set) => ({
  address: undefined, alertMessage: undefined, alertTransaction: undefined, refresh: false,
  setAddress: (address) => set({ address }),
  setAlertMessage: (alertMessage) => set({ alertMessage }),
  setAlertTransaction: (alertTransaction) => set({ alertTransaction }),
  setRefresh: (refresh) => set({ refresh }),
}));
