"use server";

import { revalidatePath } from "next/cache";
import { getServerSdkInstance } from "@/lib/actions/sdk";
import type {
  RegisterDomainInput,
  RegisterDomainResult,
} from "@/lib/actions/types";
import { validateRegistrationInput } from "@/lib/actions/validation";
import {
  ValidationError,
  DomainNotAvailableError,
  InsufficientBalanceError,
  ActionError,
} from "@/lib/actions/errors";
import { checkDomain } from "@/lib/api";

export async function registerDomain(
  input: RegisterDomainInput,
): Promise<RegisterDomainResult> {
  let validatedInput: RegisterDomainInput;

  try {
    validatedInput = validateRegistrationInput(input);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(
      error instanceof Error ? error.message : "Invalid input",
    );
  }

  // Server-side domain availability check
  const availability = await checkDomain(validatedInput.domain);
  if (availability.error) {
    throw new ActionError(
      `Failed to check domain availability: ${availability.error}`,
      "AVAILABILITY_CHECK_FAILED",
    );
  }

  if (availability.data?.domainPresent) {
    throw new DomainNotAvailableError(validatedInput.domain);
  }

  // Server-side registration via SDK
  const sdk = getServerSdkInstance();

  try {
    const intent = await sdk.domainRepository.register({
      domain: validatedInput.domain,
      to: validatedInput.to,
      subscriptionYears: validatedInput.subscriptionYears,
      byocSymbol: validatedInput.byocSymbol,
    });

    // Wait for transaction confirmation on server
    await intent.fetchResult;

    // Revalidate relevant paths
    revalidatePath("/profile");
    revalidatePath(`/domain/${validatedInput.domain}`);
    revalidatePath("/");

    return {
      success: true,
      txHash: intent.transactionHash,
      domain: validatedInput.domain,
    };
  } catch (error) {
    // Handle SDK-specific errors
    if (error instanceof Error) {
      if (error.message.includes("balance")) {
        throw new InsufficientBalanceError(validatedInput.byocSymbol);
      }
      throw new ActionError(error.message, "REGISTRATION_FAILED");
    }
    throw new ActionError("Registration failed", "UNKNOWN_ERROR");
  }
}
