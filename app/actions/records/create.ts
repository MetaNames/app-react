"use server";

import { revalidatePath } from "next/cache";
import { getServerSdkInstance } from "@/lib/actions/sdk";
import type {
  CreateRecordInput,
  CreateRecordResult,
} from "@/lib/actions/types";
import { validateDomainName } from "@/lib/actions/validation";
import { validateRecordValue } from "@/lib/records";
import { ValidationError, ActionError } from "@/lib/actions/errors";
import type { RecordClass } from "@/lib/types";
import type { RecordClassEnum } from "@metanames/sdk";

export async function createRecord(
  input: CreateRecordInput,
): Promise<CreateRecordResult> {
  const { domain, recordClass, data } = input;

  if (!domain) {
    throw new ValidationError("Domain is required");
  }

  const normalizedDomain = validateDomainName(domain);

  const validationError = validateRecordValue(recordClass as RecordClass, data);
  if (validationError) {
    throw new ValidationError(validationError);
  }

  const sdk = getServerSdkInstance();

  try {
    const domain = await sdk.domainRepository.find(normalizedDomain);
    if (!domain) {
      throw new ActionError("Domain not found", "DOMAIN_NOT_FOUND");
    }

    const recordRepo = domain.getRecordRepository(sdk);

    const intent = await recordRepo.create({
      class: recordClass as unknown as RecordClassEnum,
      data,
    });

    await intent.fetchResult;

    revalidatePath(`/domain/${normalizedDomain}`);

    return {
      success: true,
      txHash: intent.transactionHash,
    };
  } catch (error) {
    throw new ActionError(
      error instanceof Error ? error.message : "Failed to create record",
      "CREATE_RECORD_FAILED",
    );
  }
}
