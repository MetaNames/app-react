import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";
import {
  InsufficientBalanceError,
  isInsufficientBalanceError,
  TransactionError,
  errorMessage,
  reportAndAlert,
  runTransaction,
} from "../error";

describe("InsufficientBalanceError", () => {
  it("should have correct coin property and message", () => {
    const error = new InsufficientBalanceError("BTC");
    expect(error.coin).toBe("BTC");
    expect(error.message).toBe("Insufficient balance for BTC");
  });

  it("should have name property set to InsufficientBalanceError", () => {
    const error = new InsufficientBalanceError("ETH");
    expect(error.name).toBe("InsufficientBalanceError");
  });

  it("should be an instance of Error", () => {
    const error = new InsufficientBalanceError("SOL");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("isInsufficientBalanceError", () => {
  it("should return true for an InsufficientBalanceError instance", () => {
    const error = new InsufficientBalanceError("BTC");
    expect(isInsufficientBalanceError(error)).toBe(true);
  });

  it("should return false for a regular Error", () => {
    const error = new Error("Some error");
    expect(isInsufficientBalanceError(error)).toBe(false);
  });

  it("should return false for null", () => {
    expect(isInsufficientBalanceError(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isInsufficientBalanceError(undefined)).toBe(false);
  });
});

describe("errorMessage", () => {
  it("extracts the message from an Error", () => {
    expect(errorMessage(new Error("chain rejected"))).toBe("chain rejected");
  });

  it("falls back to the default message for a non-Error value", () => {
    expect(errorMessage("nope")).toBe("Something went wrong");
  });

  it("accepts a custom fallback message", () => {
    expect(errorMessage("nope", "custom fallback")).toBe("custom fallback");
  });
});

describe("reportAndAlert", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports the error to Sentry and shows a toast with the fallback message", async () => {
    const error = new Error("boom");
    await reportAndAlert(error, "Something broke");

    expect(Sentry.captureException).toHaveBeenCalledWith(error);
    expect(toast.error).toHaveBeenCalledWith("Something broke");
    expect(console.error).toHaveBeenCalledWith(error);
  });

  it("still alerts the user if Sentry reporting itself throws", async () => {
    vi.mocked(Sentry.captureException).mockImplementation(() => {
      throw new Error("sentry down");
    });

    await expect(
      reportAndAlert(new Error("boom"), "fallback"),
    ).resolves.toBeUndefined();
    expect(toast.error).toHaveBeenCalledWith("fallback");
  });
});

describe("runTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves with the result when the transaction succeeds", async () => {
    const result = {
      transactionHash: "hash-1",
      hasError: false,
      eventTrace: [],
    };

    await expect(
      runTransaction(Promise.resolve(result), "Failed to register domain."),
    ).resolves.toEqual(result);
    expect(toast.error).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("throws, reports and alerts when the transaction result resolves with hasError: true", async () => {
    // The critical gap this closes: a reverted on-chain transaction resolves
    // its promise rather than rejecting it, and must never be treated as a
    // success (app-legacy/src/lib/domain-transfer.test.ts:223-242).
    const result = {
      transactionHash: "hash-2",
      hasError: true,
      errorMessage: "reverted",
      eventTrace: [],
    };

    await expect(
      runTransaction(Promise.resolve(result), "Failed to register domain."),
    ).rejects.toThrow("Failed to register domain.");
    await expect(
      runTransaction(Promise.resolve(result), "Failed to register domain."),
    ).rejects.toBeInstanceOf(TransactionError);

    expect(Sentry.captureException).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("reverted");
  });

  it("falls back to the failure message when hasError is true with no errorMessage", async () => {
    const result = {
      transactionHash: "hash-3",
      hasError: true,
      eventTrace: [],
    };

    await expect(
      runTransaction(Promise.resolve(result), "Failed to approve mint fees."),
    ).rejects.toThrow("Failed to approve mint fees.");
    expect(toast.error).toHaveBeenCalledWith("Failed to approve mint fees.");
  });

  it("reports and alerts when the fetchResult promise rejects (wallet/RPC error)", async () => {
    await expect(
      runTransaction(
        Promise.reject(new Error("chain rejected")),
        "Failed to renew domain.",
      ),
    ).rejects.toBeInstanceOf(TransactionError);

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: "chain rejected" }),
    );
    expect(toast.error).toHaveBeenCalledWith("chain rejected");
  });

  it("falls back to a generic message when the rejection is not an Error", async () => {
    await expect(
      runTransaction(Promise.reject("nope"), "Failed to renew domain."),
    ).rejects.toThrow("Failed to renew domain.");
    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
  });
});
