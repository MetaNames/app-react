"use server";

import { revalidatePath } from "next/cache";
import { getServerSdkInstance } from "@/lib/actions/sdk";
import type {
  DeleteRecordInput,
  DeleteRecordResult,
} from "@/lib/actions/types";
import { validateDomainName } from "@/lib/actions/validation";
import { ValidationError, ActionError } from "@/lib/actions/errors";
import type { RecordClass } from "@/lib/types";

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
    // @ts-expect-error - recordRepository not typed in SDK
    const intent = await sdk.recordRepository.delete(
      recordClass as RecordClass,
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
