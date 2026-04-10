export interface Domain {
  name: string;
  nameWithoutTLD: string;
  owner: string;
  tokenId: number;
  createdAt: Date;
  expiresAt: Date | null;
  parentId: string | null;
  records: Record<string, string>;
}
export interface ITransactionIntent {
  transactionHash: string;
  fetchResult: Promise<{ transactionHash: string; hasError: boolean; errorMessage?: string }>;
}

export interface RecordRepository {
  create(params: { class: number; data: string }): Promise<ITransactionIntent>;
  update(params: { class: number; data: string }): Promise<ITransactionIntent>;
  delete(recordClass: number): Promise<ITransactionIntent>;
}
export interface AlertMessage {
  message: string;
  action?: { label: string; onClick: () => void };
}
import type { BYOCSymbol as SdkBYOCSymbol } from "@metanames/sdk/dist/providers/config";

export type BYOCSymbol = SdkBYOCSymbol;
// Testnet coins - for mainnet coins use sdk.config.byoc at runtime
export const BYOC_SYMBOLS: BYOCSymbol[] = ["TEST_COIN", "ETH_GOERLI"];
export interface FeesResponse {
  feesLabel: string;
  fees: number;
  symbol: string;
  address: string;
}
export interface DomainCheckResponse {
  domainPresent: boolean;
  parentPresent: boolean;
}
export type RecordClass =
  | "Bio"
  | "Email"
  | "Uri"
  | "Wallet"
  | "Price"
  | "Avatar"
  | "Main"
  | "Twitter"
  | "Discord";
export const PROFILE_RECORD_TYPES: RecordClass[] = [
  "Bio",
  "Email",
  "Uri",
  "Wallet",
  "Price",
  "Avatar",
  "Main",
];
export const SOCIAL_RECORD_TYPES: RecordClass[] = ["Twitter", "Discord"];
export const ALL_RECORD_TYPES: RecordClass[] = [
  ...PROFILE_RECORD_TYPES,
  ...SOCIAL_RECORD_TYPES,
];
