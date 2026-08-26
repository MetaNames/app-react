import * as Sentry from "@sentry/nextjs";
import { toast } from "sonner";

export class InsufficientBalanceError extends Error {
  constructor(public coin: string) {
    super(`Insufficient balance for ${coin}`);
    this.name = "InsufficientBalanceError";
  }
}
export const isInsufficientBalanceError = (
  e: unknown,
): e is InsufficientBalanceError => e instanceof InsufficientBalanceError;

/** Extract a user-facing message from a thrown/rejected value, matching legacy's convention. */
export function errorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * One error path: log it, report it to Sentry, tell the user via toast.
 *
 * Mirrors legacy's `reportAndAlert` (app-legacy/src/lib/error.ts): every wallet
 * and transaction failure funnels through here instead of being swallowed or
 * only shown as a raw toast with no monitoring signal.
 */
export async function reportAndAlert(
  error: unknown,
  fallbackMessage: string,
): Promise<void> {
  console.error(error);
  try {
    Sentry.captureException(error);
  } catch {
    // Never let a reporting failure (e.g. Sentry not configured) block the alert.
  }
  toast.error(fallbackMessage);
}

/** Shape shared by `ITransactionResult` — kept structural so callers don't need the SDK type. */
export interface TransactionLikeResult {
  hasError: boolean;
  errorMessage?: string;
}

/**
 * Thrown by `runTransaction` once a failure has already been reported to
 * Sentry and alerted to the user. Callers can distinguish "already handled"
 * failures from earlier errors (e.g. a wallet signature rejection) that still
 * need reporting themselves.
 */
export class TransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransactionError";
  }
}

/**
 * Await a transaction's on-chain result and report+alert on failure — whether
 * the promise rejects (wallet/RPC error, user rejection) or resolves with
 * `hasError: true` (the transaction reverted on-chain).
 *
 * Mirrors legacy's `alertTransactionAndFetchResult` + `runTransaction`
 * (app-legacy/src/lib/transaction.ts): a resolved-but-reverted transaction
 * must never be reported as a success, and every failure path is reported to
 * Sentry and surfaced to the user — nothing is swallowed.
 *
 * Throws `failureMessage` in both failure cases so callers stop their success
 * path (toast.success / navigation / setting `feesApproved`).
 */
export async function runTransaction<T extends TransactionLikeResult>(
  fetchResult: Promise<T>,
  failureMessage: string,
): Promise<T> {
  const result = await fetchResult.catch(async (error) => {
    await reportAndAlert(error, errorMessage(error));
    throw new TransactionError(failureMessage);
  });

  if (result.hasError) {
    await reportAndAlert(
      new Error(result.errorMessage ?? failureMessage),
      result.errorMessage ?? failureMessage,
    );
    throw new TransactionError(failureMessage);
  }

  return result;
}
