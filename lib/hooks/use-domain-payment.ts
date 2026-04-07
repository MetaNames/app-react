"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { useSdkStore } from "@/lib/stores/sdk-store";
import { fetchRegistrationFees } from "@/lib/api";
import { getAccountBalanceForCoin } from "@/lib/sdk";
import {
  InsufficientBalanceError,
  isInsufficientBalanceError,
} from "@/lib/error";
import { bridgeUrl, explorerTransactionUrl } from "@/lib/url";
import type { FeesResponse } from "@/lib/types";
import type { BYOCSymbol as SdkBYOCSymbol } from "@metanames/sdk/dist/providers/config";
import { toast } from "sonner";

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
  setSelectedCoin: (coin: SdkBYOCSymbol) => void;
  availableCoins: string[];
  total: string;
  domainCharCount: number;
  handleApproveFees: () => Promise<void>;
  handleSubmit: () => Promise<void>;
}

export function useDomainPayment({
  domain,
  mode,
  onSuccess,
}: UseDomainPaymentProps): UseDomainPaymentReturn {
  const router = useRouter();
  const { address } = useWalletStore();
  const { metaNamesSdk, selectedCoin, setSelectedCoin, availableCoins } =
    useSdkStore();
  const [years, setYears] = useState(1);
  const [fees, setFees] = useState<FeesResponse | null>(null);
  const [feesApproved, setFeesApproved] = useState(false);
  const [loadingFees, setLoadingFees] = useState(false);

  const loadFees = useCallback(
    async (signal: AbortSignal) => {
      setLoadingFees(true);
      setFeesApproved(false);
      try {
        const { data } = await fetchRegistrationFees(domain, selectedCoin);
        if (signal.aborted) return;
        setFees(data);
      } finally {
        if (!signal.aborted) setLoadingFees(false);
      }
    },
    [domain, selectedCoin],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadFees(controller.signal);
    return () => controller.abort();
  }, [loadFees]);

  const handleApproveFees = async () => {
    if (!metaNamesSdk || !address || !fees) return;
    try {
      const balance = await getAccountBalanceForCoin(address, selectedCoin);
      const total = (fees.fees || 0) * years;
      if (balance < total) throw new InsufficientBalanceError(selectedCoin);
      const intent = await metaNamesSdk.domainRepository.approveMintFees(
        domain,
        selectedCoin as SdkBYOCSymbol,
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
      await intent.fetchResult;
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
      } else {
        throw e;
      }
    }
  };

  const handleSubmit = async () => {
    if (!metaNamesSdk || !address) return;
    let intent;
    if (mode === "register") {
      intent = await metaNamesSdk.domainRepository.register({
        domain,
        to: address,
        subscriptionYears: years,
        byocSymbol: selectedCoin as SdkBYOCSymbol,
      });
    } else {
      intent = await metaNamesSdk.domainRepository.renew({
        domain,
        payer: address,
        byocSymbol: selectedCoin as SdkBYOCSymbol,
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
    await intent.fetchResult;
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
    if (onSuccess) onSuccess();
    else router.push(`/domain/${domain}`);
  };

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
