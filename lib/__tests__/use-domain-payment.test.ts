import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useWalletStore } from "../stores/wallet-store";
import { useSdkStore } from "../stores/sdk-store";
import {
  useDomainPayment,
  isStaleFeeResponse,
} from "../hooks/use-domain-payment";
import type { MetaNamesSdk } from "@metanames/sdk";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock("@vercel/analytics", () => ({
  track: vi.fn(),
}));

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/url", () => ({
  explorerTransactionUrl: (tx: string) => `https://explorer/${tx}`,
  bridgeUrl: () => "https://bridge",
}));

const fetchRegistrationFees = vi.fn();
vi.mock("@/lib/api", () => ({
  fetchRegistrationFees: (...args: unknown[]) => fetchRegistrationFees(...args),
}));

const getAccountBalanceForCoin = vi.fn();
vi.mock("@/lib/sdk", () => ({
  getAccountBalanceForCoin: (...args: unknown[]) =>
    getAccountBalanceForCoin(...args),
}));

import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";

function sdkWithByoc(
  symbols: string[],
  overrides: Record<string, unknown> = {},
) {
  return {
    config: { byoc: symbols.map((symbol) => ({ symbol })) },
    domainRepository: {
      approveMintFees: vi.fn(),
      register: vi.fn(),
      renew: vi.fn(),
    },
    ...overrides,
  } as unknown as MetaNamesSdk;
}

function resolvedResult(
  overrides: Partial<{
    hasError: boolean;
    errorMessage: string;
  }> = {},
) {
  return {
    transactionHash: "hash-1",
    hasError: false,
    eventTrace: [],
    ...overrides,
  };
}

describe("isStaleFeeResponse", () => {
  it("accepts a response from the newest generation for the current coin", () => {
    expect(isStaleFeeResponse(3, 3, "ETH", "ETH")).toBe(false);
  });

  it("rejects a response from an older generation", () => {
    expect(isStaleFeeResponse(2, 3, "ETH", "ETH")).toBe(true);
  });

  it("rejects a response for a coin that is no longer selected", () => {
    expect(isStaleFeeResponse(1, 1, "ETH", "MATIC")).toBe(true);
  });

  it("does not confuse generation 0 with an unset guard", () => {
    expect(isStaleFeeResponse(0, 0, "ETH", "ETH")).toBe(false);
    expect(isStaleFeeResponse(0, 1, "ETH", "ETH")).toBe(true);
  });
});

describe("useDomainPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    useWalletStore.setState({ address: "0xaddress" });
    useSdkStore.setState({ metaNamesSdk: null, _selectedCoin: undefined });
    fetchRegistrationFees.mockResolvedValue({
      data: { feesLabel: 10, symbol: "ETH" },
      error: null,
    });
    getAccountBalanceForCoin.mockResolvedValue(100);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults selectedCoin to ETH even when it is not first in the byoc list", async () => {
    useSdkStore.setState({ metaNamesSdk: sdkWithByoc(["MATIC", "ETH"]) });
    const { result } = renderHook(() =>
      useDomainPayment({ domain: "test.mpc", mode: "register" }),
    );
    expect(result.current.selectedCoin).toBe("ETH");
  });

  describe("handleApproveFees", () => {
    it("approves fees and reports nothing on a clean success", async () => {
      const sdk = sdkWithByoc(["ETH"]);
      vi.mocked(sdk.domainRepository.approveMintFees).mockResolvedValue({
        transactionHash: "hash-1",
        fetchResult: Promise.resolve(resolvedResult()),
      });
      useSdkStore.setState({ metaNamesSdk: sdk });

      const { result } = renderHook(() =>
        useDomainPayment({ domain: "test.mpc", mode: "register" }),
      );
      await waitFor(() => expect(result.current.fees).not.toBeNull());

      await act(async () => {
        await result.current.handleApproveFees();
      });

      expect(result.current.feesApproved).toBe(true);
      expect(toast.error).not.toHaveBeenCalled();
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    // Gap #1: a transaction whose promise *resolves* with hasError: true (a
    // contract revert) must not be treated as approved/successful.
    it("does not approve fees and alerts when the on-chain result has hasError: true", async () => {
      const sdk = sdkWithByoc(["ETH"]);
      vi.mocked(sdk.domainRepository.approveMintFees).mockResolvedValue({
        transactionHash: "hash-1",
        fetchResult: Promise.resolve(
          resolvedResult({ hasError: true, errorMessage: "reverted on-chain" }),
        ),
      });
      useSdkStore.setState({ metaNamesSdk: sdk });

      const { result } = renderHook(() =>
        useDomainPayment({ domain: "test.mpc", mode: "register" }),
      );
      await waitFor(() => expect(result.current.fees).not.toBeNull());

      await act(async () => {
        await expect(result.current.handleApproveFees()).rejects.toThrow();
      });

      expect(result.current.feesApproved).toBe(false);
      expect(toast.error).toHaveBeenCalledWith("reverted on-chain");
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    // Gap #2: a rejected fee-approval transaction must alert and report, not
    // be silently swallowed.
    it("alerts and reports when approveMintFees itself rejects (e.g. wallet rejection)", async () => {
      const sdk = sdkWithByoc(["ETH"]);
      vi.mocked(sdk.domainRepository.approveMintFees).mockRejectedValue(
        new Error("User rejected the request"),
      );
      useSdkStore.setState({ metaNamesSdk: sdk });

      const { result } = renderHook(() =>
        useDomainPayment({ domain: "test.mpc", mode: "register" }),
      );
      await waitFor(() => expect(result.current.fees).not.toBeNull());

      await act(async () => {
        await expect(result.current.handleApproveFees()).rejects.toThrow();
      });

      expect(result.current.feesApproved).toBe(false);
      expect(toast.error).toHaveBeenCalledWith("User rejected the request");
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: "User rejected the request" }),
      );
    });

    it("shows the insufficient-balance toast and does not report to Sentry", async () => {
      getAccountBalanceForCoin.mockResolvedValue(0);
      const sdk = sdkWithByoc(["ETH"]);
      useSdkStore.setState({ metaNamesSdk: sdk });

      const { result } = renderHook(() =>
        useDomainPayment({ domain: "test.mpc", mode: "register" }),
      );
      await waitFor(() => expect(result.current.fees).not.toBeNull());

      await act(async () => {
        await expect(result.current.handleApproveFees()).rejects.toThrow();
      });

      expect(toast).toHaveBeenCalledWith(
        "Insufficient balance for ETH",
        expect.anything(),
      );
      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(sdk.domainRepository.approveMintFees).not.toHaveBeenCalled();
    });
  });

  describe("handleSubmit", () => {
    it("registers successfully and shows the success toast", async () => {
      const sdk = sdkWithByoc(["ETH"]);
      vi.mocked(sdk.domainRepository.register).mockResolvedValue({
        transactionHash: "hash-2",
        fetchResult: Promise.resolve(resolvedResult()),
      });
      useSdkStore.setState({ metaNamesSdk: sdk });

      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useDomainPayment({ domain: "test.mpc", mode: "register", onSuccess }),
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(toast.success).toHaveBeenCalledWith(
        "Domain registered successfully!",
        expect.anything(),
      );
      expect(onSuccess).toHaveBeenCalled();
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    // Gap #1: the headline gap — a reverted transaction resolves rather than
    // rejects, and must not fall through to the success toast/navigation.
    it("does not show a success toast when the submitted transaction has hasError: true", async () => {
      const sdk = sdkWithByoc(["ETH"]);
      vi.mocked(sdk.domainRepository.register).mockResolvedValue({
        transactionHash: "hash-2",
        fetchResult: Promise.resolve(
          resolvedResult({ hasError: true, errorMessage: "reverted" }),
        ),
      });
      useSdkStore.setState({ metaNamesSdk: sdk });

      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useDomainPayment({ domain: "test.mpc", mode: "register", onSuccess }),
      );

      await act(async () => {
        await expect(result.current.handleSubmit()).rejects.toThrow();
      });

      expect(toast.success).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
      expect(push).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("reverted");
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    // Gap #2: a rejected submit transaction (wallet rejection or RPC error)
    // must alert and report instead of becoming an unhandled rejection.
    it("alerts and reports when the submit call itself rejects", async () => {
      const sdk = sdkWithByoc(["ETH"]);
      vi.mocked(sdk.domainRepository.renew).mockRejectedValue(
        new Error("User rejected the request"),
      );
      useSdkStore.setState({ metaNamesSdk: sdk });

      const { result } = renderHook(() =>
        useDomainPayment({ domain: "test.mpc", mode: "renew" }),
      );

      await act(async () => {
        await expect(result.current.handleSubmit()).rejects.toThrow();
      });

      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("User rejected the request");
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: "User rejected the request" }),
      );
    });
  });

  describe("stale fee response guard", () => {
    it("ignores an older fee response that resolves after a coin switch", async () => {
      const sdk = sdkWithByoc(["ETH", "MATIC"]);
      useSdkStore.setState({ metaNamesSdk: sdk });

      let resolveEthFees: (v: { data: unknown; error: null }) => void;
      const ethFeesPromise = new Promise((resolve) => {
        resolveEthFees = resolve;
      });
      fetchRegistrationFees.mockImplementationOnce(() => ethFeesPromise);
      fetchRegistrationFees.mockImplementationOnce(() =>
        Promise.resolve({
          data: { feesLabel: 20, symbol: "MATIC" },
          error: null,
        }),
      );

      const { result, rerender } = renderHook(
        ({ coin }: { coin: "ETH" | "MATIC" }) => {
          if (coin !== useSdkStore.getState()._selectedCoin) {
            useSdkStore.setState({ _selectedCoin: coin });
          }
          return useDomainPayment({ domain: "test.mpc", mode: "register" });
        },
        { initialProps: { coin: "ETH" } as { coin: "ETH" | "MATIC" } },
      );

      rerender({ coin: "MATIC" as const });
      await waitFor(() => expect(result.current.fees?.symbol).toBe("MATIC"));

      // The stale ETH response resolves after the MATIC one already landed —
      // it must not overwrite the fresher MATIC fees.
      resolveEthFees!({ data: { feesLabel: 10, symbol: "ETH" }, error: null });
      await Promise.resolve();
      await Promise.resolve();

      expect(result.current.fees?.symbol).toBe("MATIC");
    });
  });
});
