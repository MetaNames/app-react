import { validateAddress } from "@/lib/wallet";
import { normalizeDomain } from "@/lib/domain-validator";
import type {
  RegisterDomainInput,
  TransferDomainInput,
  RenewDomainInput,
} from "./types";
import { ValidationError } from "./errors";

export function validateDomainName(domain: string): string {
  const normalized = normalizeDomain(domain);
  if (!normalized) {
    throw new ValidationError("Invalid domain name");
  }
  return normalized;
}

export function validateRegistrationInput(
  input: RegisterDomainInput,
): RegisterDomainInput {
  const { domain, to, subscriptionYears, byocSymbol } = input;

  if (!domain || typeof domain !== "string") {
    throw new ValidationError("Domain is required");
  }

  const normalizedDomain = validateDomainName(domain);

  if (!to || !validateAddress(to)) {
    throw new ValidationError("Invalid recipient address");
  }

  if (!subscriptionYears || subscriptionYears < 1 || subscriptionYears > 10) {
    throw new ValidationError("Subscription years must be between 1 and 10");
  }

  if (!byocSymbol || typeof byocSymbol !== "string") {
    throw new ValidationError("Invalid BYOC symbol");
  }

  return {
    domain: normalizedDomain,
    to,
    subscriptionYears,
    byocSymbol,
  };
}

export function validateTransferInput(
  input: TransferDomainInput,
): TransferDomainInput {
  const { domain, from, to } = input;

  if (!domain) {
    throw new ValidationError("Domain is required");
  }

  const normalizedDomain = validateDomainName(domain);

  if (!from || !validateAddress(from)) {
    throw new ValidationError("Invalid sender address");
  }

  if (!to || !validateAddress(to)) {
    throw new ValidationError("Invalid recipient address");
  }

  if (from === to) {
    throw new ValidationError("Sender and recipient must be different");
  }

  return {
    domain: normalizedDomain,
    from,
    to,
  };
}

export function validateRenewInput(input: RenewDomainInput): RenewDomainInput {
  const { domain, payer, subscriptionYears, byocSymbol } = input;

  if (!domain) {
    throw new ValidationError("Domain is required");
  }

  const normalizedDomain = validateDomainName(domain);

  if (!payer || !validateAddress(payer)) {
    throw new ValidationError("Invalid payer address");
  }

  if (!subscriptionYears || subscriptionYears < 1 || subscriptionYears > 10) {
    throw new ValidationError("Subscription years must be between 1 and 10");
  }

  if (!byocSymbol || typeof byocSymbol !== "string") {
    throw new ValidationError("Invalid BYOC symbol");
  }

  return {
    domain: normalizedDomain,
    payer,
    subscriptionYears,
    byocSymbol,
  };
}
