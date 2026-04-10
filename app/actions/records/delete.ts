"use server";

import { revalidatePath } from "next/cache";
import { getServerSdkInstance } from "@/lib/actions/sdk";
import type {
  DeleteRecordInput,
  DeleteRecordResult,
} from "@/lib/actions/types";
import { validateDomainName } from "@/lib/actions/validation";
import { ValidationError, ActionError } from "@/lib/actions/errors";
import type { RecordClassEnum } from "@metanames/sdk";

export async function deleteRecord(
  input: DeleteRecordInput,
): Promise<DeleteRecordResult> {
  const { domain, recordClass } = input;

  if (!domain) {
    throw new ValidationError("Domain is required");
  }

  const normalizedDomain = validateDomainName(domain);

  const sdk = getServerSdkInstance();

  try {
    const domainEntity = await sdk.domainRepository.find(normalizedDomain);
    if (!domainEntity) {
      throw new ActionError("Domain not found", "DOMAIN_NOT_FOUND");
    }

    const recordRepo = domainEntity.getRecordRepository(sdk);

    const intent = await recordRepo.delete(
      recordClass as unknown as RecordClassEnum,
    );

    await intent.fetchResult;

    revalidatePath(`/domain/${normalizedDomain}`);

    return {
      success: true,
      txHash: intent.transactionHash,
    };
  } catch (error) {
    throw new ActionError(
      error instanceof Error ? error.message : "Failed to delete record",
      "DELETE_RECORD_FAILED",
    );
  }
}
