"use server";

import { getServerSdkInstance } from "@/lib/actions/sdk";
import type { BYOCSymbol } from "@/lib/types";
import { validateDomainName } from "@/lib/actions/validation";
import { ValidationError, ActionError } from "@/lib/actions/errors";

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

export async function approveMintFees(
  input: ApproveFeesInput,
): Promise<ApproveFeesResult> {
  const { domain, byocSymbol, years } = input;

  if (!domain) {
    throw new ValidationError("Domain is required");
  }

  if (!years || years < 1) {
    throw new ValidationError("Years must be at least 1");
  }

  const normalizedDomain = validateDomainName(domain);

  const sdk = getServerSdkInstance();

  try {
    const intent = await sdk.domainRepository.approveMintFees(
      normalizedDomain,
      byocSymbol,
      years,
    );

    await intent.fetchResult;

    return {
      success: true,
      txHash: intent.transactionHash,
      feesApproved: true,
    };
  } catch (error) {
    throw new ActionError(
      error instanceof Error ? error.message : "Failed to approve fees",
      "APPROVE_FEES_FAILED",
    );
  }
}
