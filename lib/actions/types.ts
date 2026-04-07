import type { BYOCSymbol, RecordClass } from "@/lib/types";

export interface RegisterDomainInput {
  domain: string;
  to: string;
  subscriptionYears: number;
  byocSymbol: BYOCSymbol;
}

export interface RegisterDomainResult {
  success: boolean;
  txHash?: string;
  domain?: string;
}

export interface RenewDomainInput {
  domain: string;
  payer: string;
  subscriptionYears: number;
  byocSymbol: BYOCSymbol;
}

export interface RenewDomainResult {
  success: boolean;
  txHash?: string;
}

export interface TransferDomainInput {
  domain: string;
  from: string;
  to: string;
}

export interface TransferDomainResult {
  success: boolean;
  txHash?: string;
}

export interface ApproveFeesInput {
  domain: string;
  byocSymbol: BYOCSymbol;
  years: number;
}

export interface ApproveFeesResult {
  success: boolean;
  txHash?: string;
  feesApproved?: boolean;
}

export interface CreateRecordInput {
  domain: string;
  recordClass: RecordClass;
  data: string;
}

export interface CreateRecordResult {
  success: boolean;
  txHash?: string;
}

export interface UpdateRecordInput {
  domain: string;
  recordClass: RecordClass;
  data: string;
}

export interface UpdateRecordResult {
  success: boolean;
  txHash?: string;
}

export interface DeleteRecordInput {
  domain: string;
  recordClass: RecordClass;
}

export interface DeleteRecordResult {
  success: boolean;
  txHash?: string;
}
