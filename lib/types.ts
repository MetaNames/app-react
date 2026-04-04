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
export interface RecordRepository {
  create(params: { class: RecordClass; data: string }): Promise<any>;
  update(params: { class: RecordClass; data: string }): Promise<any>;
  delete(recordClass: RecordClass): Promise<any>;
}
export interface AlertMessage {
  message: string;
  action?: { label: string; onClick: () => void };
}
export type BYOCSymbol = 'PARTI' | 'BTC' | 'ETH' | 'USDT' | 'TEST_COIN';
export const BYOC_SYMBOLS: BYOCSymbol[] = ['BTC', 'ETH', 'USDT', 'PARTI', 'TEST_COIN'];
export interface FeesResponse { feesLabel: string; fees: number; symbol: string; address: string; }
export interface DomainCheckResponse { domainPresent: boolean; parentPresent: boolean; }
export type RecordClass = 'Bio'|'Email'|'Uri'|'Wallet'|'Price'|'Avatar'|'Main'|'Twitter'|'Discord';
export const PROFILE_RECORD_TYPES: RecordClass[] = ['Bio','Email','Uri','Wallet','Price','Avatar','Main'];
export const SOCIAL_RECORD_TYPES: RecordClass[] = ['Twitter','Discord'];
export const ALL_RECORD_TYPES: RecordClass[] = [...PROFILE_RECORD_TYPES, ...SOCIAL_RECORD_TYPES];
