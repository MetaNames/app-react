"use server";

import { revalidatePath } from "next/cache";
import { getServerSdkInstance } from "@/lib/actions/sdk";
import type { RenewDomainInput, RenewDomainResult } from "@/lib/actions/types";
import { validateRenewInput } from "@/lib/actions/validation";
import {
  NotDomainOwnerError,
  InsufficientBalanceError,
  ActionError,
} from "@/lib/actions/errors";

export async function renewDomain(
  input: RenewDomainInput,
): Promise<RenewDomainResult> {
  const validatedInput = validateRenewInput(input);

  const sdk = getServerSdkInstance();

  try {
    // Verify ownership
    const domain = await sdk.domainRepository.find(validatedInput.domain);
    if (!domain) {
      throw new ActionError(
        `Domain ${validatedInput.domain} not found`,
        "DOMAIN_NOT_FOUND",
        404,
      );
    }

    if (domain.owner.toLowerCase() !== validatedInput.payer.toLowerCase()) {
      throw new NotDomainOwnerError(validatedInput.domain);
    }

    const intent = await sdk.domainRepository.renew({
      domain: validatedInput.domain,
      payer: validatedInput.payer,
      byocSymbol: validatedInput.byocSymbol,
      subscriptionYears: validatedInput.subscriptionYears,
    });

    await intent.fetchResult;

    revalidatePath("/profile");
    revalidatePath(`/domain/${validatedInput.domain}`);

    return {
      success: true,
      txHash: intent.transactionHash,
    };
  } catch (error) {
    if (error instanceof ActionError) {
      throw error;
    }
    if (error instanceof Error) {
      if (error.message.includes("balance")) {
        throw new InsufficientBalanceError(validatedInput.byocSymbol);
      }
      throw new ActionError(error.message, "RENEW_FAILED");
    }
    throw new ActionError("Renewal failed", "UNKNOWN_ERROR");
  }
}
