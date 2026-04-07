"use server";

import { revalidatePath } from "next/cache";
import { getServerSdkInstance } from "@/lib/actions/sdk";
import type {
  TransferDomainInput,
  TransferDomainResult,
} from "@/lib/actions/types";
import { validateTransferInput } from "@/lib/actions/validation";
import { NotDomainOwnerError, ActionError } from "@/lib/actions/errors";

export async function transferDomain(
  input: TransferDomainInput,
): Promise<TransferDomainResult> {
  const validatedInput = validateTransferInput(input);

  const sdk = getServerSdkInstance();

  try {
    // Verify ownership on server
    const domain = await sdk.domainRepository.find(validatedInput.domain);
    if (!domain) {
      throw new ActionError(
        `Domain ${validatedInput.domain} not found`,
        "DOMAIN_NOT_FOUND",
        404,
      );
    }

    if (domain.owner.toLowerCase() !== validatedInput.from.toLowerCase()) {
      throw new NotDomainOwnerError(validatedInput.domain);
    }

    const intent = await sdk.domainRepository.transfer({
      domain: validatedInput.domain,
      from: validatedInput.from,
      to: validatedInput.to,
    });

    // Wait for transaction confirmation on server
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
    throw new ActionError(
      error instanceof Error ? error.message : "Transfer failed",
      "TRANSFER_FAILED",
    );
  }
}
