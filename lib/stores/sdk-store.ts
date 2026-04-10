import { create } from "zustand";
import type { MetaNamesSdk } from "@metanames/sdk";
import type { BYOCSymbol } from "@metanames/sdk/dist/providers/config";

interface SdkStore {
  metaNamesSdk: MetaNamesSdk | null;
  setMetaNamesSdk: (sdk: MetaNamesSdk) => void;
  setSelectedCoin: (coin: BYOCSymbol) => void;
  _selectedCoin: BYOCSymbol | undefined;
}

export const useSdkStore = create<SdkStore>((set) => ({
  metaNamesSdk: null,
  _selectedCoin: undefined,
  setMetaNamesSdk: (metaNamesSdk) => set({ metaNamesSdk }),
  setSelectedCoin: (selectedCoin) => set({ _selectedCoin: selectedCoin }),
}));

export const selectAvailableCoins = (state: SdkStore): BYOCSymbol[] =>
  (state.metaNamesSdk?.config?.byoc?.map((b) => b.symbol) as BYOCSymbol[]) ??
  [];

export const selectSelectedCoin = (state: SdkStore): BYOCSymbol => {
  const coins = selectAvailableCoins(state);
  if (state._selectedCoin) {
    if (coins.length === 0 || coins.includes(state._selectedCoin)) {
      return state._selectedCoin;
    }
  }
  return coins[0] ?? "ETH";
};
