import { create } from 'zustand';
import type { BYOCSymbol } from '../types';
interface SdkStore {
  metaNamesSdk: any | null;
  selectedCoin: BYOCSymbol;
  setMetaNamesSdk: (sdk: any) => void;
  setSelectedCoin: (coin: BYOCSymbol) => void;
}
// NOTE: Using `null` instead of `metaNamesSdkFactory()` to avoid SSR issues.
// `metaNamesSdkFactory()` requires browser APIs. The SdkInitializer in providers
// calls `setMetaNamesSdk(metaNamesSdkFactory())` on mount to defer SDK creation to the client.
export const useSdkStore = create<SdkStore>((set) => ({
  metaNamesSdk: null, selectedCoin: 'TEST_COIN',
  setMetaNamesSdk: (metaNamesSdk) => set({ metaNamesSdk }),
  setSelectedCoin: (selectedCoin) => set({ selectedCoin }),
}));
