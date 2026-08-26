"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { useSdkStore } from "@/lib/stores/sdk-store";
import { fetchRegistrationFees } from "@/lib/api";
import { getAccountBalanceForCoin } from "@/lib/sdk";
import {
  InsufficientBalanceError,
  isInsufficientBalanceError,
  TransactionError,
  errorMessage,
  reportAndAlert,
  runTransaction,
} from "@/lib/error";
import { bridgeUrl, explorerTransactionUrl } from "@/lib/url";
import type { FeesResponse } from "@/lib/types";
import type { BYOCSymbol } from "@metanames/sdk/dist/providers/config";
import { toast } from "sonner";
import { track } from "@vercel/analytics";

interface UseDomainPaymentProps {
  domain: string;
  mode: "register" | "renew";
  onSuccess?: () => void;
}

interface UseDomainPaymentReturn {
  years: number;
  setYears: (years: number | ((prev: number) => number)) => void;
  fees: FeesResponse | null;
  feesApproved: boolean;
  loadingFees: boolean;
  address: string | undefined;
  selectedCoin: string;
  setSelectedCoin: (coin: BYOCSymbol) => void;
  availableCoins: string[];
  total: string;
  domainCharCount: number;
  handleApproveFees: () => Promise<void>;
  handleSubmit: () => Promise<void>;
}

/**
 * Prefer ETH as the default coin when nothing has been explicitly selected —
 * matching legacy's `stores/sdk.ts`, which searches `byocs` for `symbol ===
 * 'ETH'` and only falls back to `byocs[0]` when ETH is absent.
 */
function pickDefaultCoin(coins: BYOCSymbol[]): BYOCSymbol | undefined {
  return coins.find((c) => c === "ETH") ?? coins[0];
}

/**
 * Staleness guard for async fee responses, mirroring legacy's
 * `isStaleFeeResponse` (app-legacy/src/lib/payment-fees.ts). A resolution may
 * only write state when its request is still the newest one: same generation
 * (bumped on every fee load) and same coin (a token switch starts a new
 * request). A slow older fetch resolving late must never overwrite fresher
 * state.
 */
export function isStaleFeeResponse(
  requestGeneration: number,
  currentGeneration: number,
  requestCoin: string,
  currentCoin: string,
): boolean {
  return requestGeneration !== currentGeneration || requestCoin !== currentCoin;
}

export function useDomainPayment({
  domain,
  mode,
  onSuccess,
}: UseDomainPaymentProps): UseDomainPaymentReturn {
  const router = useRouter();
  const { address } = useWalletStore();
  const metaNamesSdk = useSdkStore((s) => s.metaNamesSdk);
  const setSelectedCoin = useSdkStore((s) => s.setSelectedCoin);
  const _selectedCoin = useSdkStore((s) => s._selectedCoin);

  const availableCoins = useMemo(
    () =>
      (metaNamesSdk?.config?.byoc?.map((b) => b.symbol) as BYOCSymbol[]) ?? [],
    [metaNamesSdk],
  );

  const selectedCoin = useMemo(() => {
    if (
      _selectedCoin &&
      (availableCoins.length === 0 || availableCoins.includes(_selectedCoin))
    ) {
      return _selectedCoin;
    }
    return pickDefaultCoin(availableCoins) ?? "ETH";
  }, [_selectedCoin, availableCoins]);
  const [years, setYears] = useState(1);
  const [fees, setFees] = useState<FeesResponse | null>(null);
  const [feesApproved, setFeesApproved] = useState(false);
  const [loadingFees, setLoadingFees] = useState(false);

  // Bumped on every fee load. Together with the coin captured at request time
  // it identifies the newest fee request; responses from older
  // generations/coins are dropped as stale (see `isStaleFeeResponse`).
  const feesGenerationRef = useRef(0);
  const selectedCoinRef = useRef(selectedCoin);
  useEffect(() => {
    selectedCoinRef.current = selectedCoin;
  }, [selectedCoin]);

  const loadFees = useCallback(async () => {
    const generation = ++feesGenerationRef.current;
    const coin = selectedCoin;
    setLoadingFees(true);
    setFeesApproved(false);
    try {
      const { data } = await fetchRegistrationFees(domain, coin);
      if (
        isStaleFeeResponse(
          generation,
          feesGenerationRef.current,
          coin,
          selectedCoinRef.current,
        )
      )
        return;
      setFees(data);
    } finally {
      if (
        !isStaleFeeResponse(
          generation,
          feesGenerationRef.current,
          coin,
          selectedCoinRef.current,
        )
      )
        setLoadingFees(false);
    }
  }, [domain, selectedCoin]);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  const handleApproveFees = useCallback(async () => {
    if (!metaNamesSdk || !address || !fees) return;
    try {
      const balance = await getAccountBalanceForCoin(address, selectedCoin);
      const total = parseFloat(String(fees.feesLabel)) * years;
      if (balance < total) throw new InsufficientBalanceError(selectedCoin);
      const intent = await metaNamesSdk.domainRepository.approveMintFees(
        domain,
        selectedCoin as BYOCSymbol,
        years,
      );
      const txHash = intent.transactionHash;
      toast("New Transaction submitted", {
        action: {
          label: "View",
          onClick: () => window.open(explorerTransactionUrl(txHash), "_blank"),
        },
        duration: 10000,
      });
      await runTransaction(intent.fetchResult, "Failed to approve mint fees.");
      setFeesApproved(true);
    } catch (e) {
      if (isInsufficientBalanceError(e)) {
        toast(`Insufficient balance for ${e.coin}`, {
          duration: 5000,
          action: {
            label: "Add funds",
            onClick: () => window.open(bridgeUrl(), "_blank"),
          },
        });
      } else if (e instanceof TransactionError) {
        // Already reported to Sentry and alerted via toast inside runTransaction.
      } else {
        // Wallet rejection, signing failure, or any other error thrown before
        // a transaction was even submitted — never silently swallowed.
        await reportAndAlert(e, errorMessage(e));
      }
      // Rethrow so callers (LoadingButton) can distinguish failure from
      // success; the user has already been alerted above.
      throw e;
    }
  }, [metaNamesSdk, address, fees, selectedCoin, years, domain]);

  const handleSubmit = useCallback(async () => {
    if (!metaNamesSdk || !address) return;
    try {
      let intent;
      if (mode === "register") {
        intent = await metaNamesSdk.domainRepository.register({
          domain,
          to: address,
          subscriptionYears: years,
          byocSymbol: selectedCoin as BYOCSymbol,
        });
      } else {
        intent = await metaNamesSdk.domainRepository.renew({
          domain,
          payer: address,
          byocSymbol: selectedCoin as BYOCSymbol,
          subscriptionYears: years,
        });
      }
      const txHash = intent.transactionHash;
      toast("New Transaction submitted", {
        action: {
          label: "View",
          onClick: () => window.open(explorerTransactionUrl(txHash), "_blank"),
        },
        duration: 10000,
      });
      const failureMessage =
        mode === "register"
          ? "Failed to register domain."
          : "Failed to renew domain.";
      await runTransaction(intent.fetchResult, failureMessage);
      const msg =
        mode === "register"
          ? "Domain registered successfully!"
          : "Domain renewed successfully!";
      toast.success(msg, {
        action: {
          label: "Go to profile",
          onClick: () => router.push("/profile"),
        },
      });
      track(mode === "register" ? "domain_registered" : "domain_renewed");
      if (onSuccess) onSuccess();
      else router.push(`/domain/${domain}`);
    } catch (e) {
      if (!(e instanceof TransactionError)) {
        // Rejected signature request, or any failure before the transaction was
        // even submitted — must not be swallowed as an unreported, silent no-op.
        // A TransactionError was already reported and alerted in runTransaction.
        await reportAndAlert(e, errorMessage(e));
      }
      // Rethrow so callers (LoadingButton) can distinguish failure from
      // success; the user has already been alerted above.
      throw e;
    }
  }, [
    metaNamesSdk,
    address,
    mode,
    domain,
    years,
    selectedCoin,
    onSuccess,
    router,
  ]);

  const total = fees
    ? (parseFloat(String(fees.feesLabel)) * years).toFixed(4)
    : "—";
  const domainCharCount = domain.replace(/\.mpc$/, "").split(".")[0].length;

  return {
    years,
    setYears,
    fees,
    feesApproved,
    loadingFees,
    address,
    selectedCoin,
    setSelectedCoin,
    availableCoins,
    total,
    domainCharCount,
    handleApproveFees,
    handleSubmit,
  };
}
