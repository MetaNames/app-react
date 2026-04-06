import { create } from 'zustand';
import type { MetaNamesSdk } from '@metanames/sdk';
import type { BYOCSymbol } from '@metanames/sdk/dist/providers/config';

interface SdkStore {
  metaNamesSdk: MetaNamesSdk | null;
  availableCoins: BYOCSymbol[];
  selectedCoin: BYOCSymbol;
  setMetaNamesSdk: (sdk: MetaNamesSdk) => void;
  setSelectedCoin: (coin: BYOCSymbol) => void;
}
export const useSdkStore = create<SdkStore>((set) => ({
  metaNamesSdk: null,
  availableCoins: [],
  selectedCoin: 'ETH',
  setMetaNamesSdk: (metaNamesSdk) => set({
    metaNamesSdk,
    availableCoins: metaNamesSdk.config?.byoc?.map(b => b.symbol) as BYOCSymbol[] ?? [],
    selectedCoin: (metaNamesSdk.config?.byoc?.[0]?.symbol as BYOCSymbol) ?? 'ETH',
  }),
  setSelectedCoin: (selectedCoin) => set({ selectedCoin }),
}));
