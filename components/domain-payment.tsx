"use client";
import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingButton } from "@/components/loading-button";
import { RequireWalletConnection } from "@/components/require-wallet-connection";
import { useDomainPayment } from "@/lib/hooks/use-domain-payment";
import { Minus, Plus, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BYOCSymbol as SdkBYOCSymbol } from "@metanames/sdk/providers/config";

interface DomainPaymentProps {
  domain: string;
  mode: "register" | "renew";
  onSuccess?: () => void;
}

/**
 * Payment is a two-transaction flow (approve the fee transfer, then mint or
 * renew). Showing it as an explicit two-step sequence is what stops users
 * from reading the disabled second button as a broken page.
 */
function StepIndicator({ feesApproved }: { feesApproved: boolean }) {
  const steps = [
    { label: "Approve fees", done: feesApproved },
    // Deliberately mode-neutral: the words "registration"/"renewal" already
    // appear in the fee breakdown, and duplicating them here would make the
    // page ambiguous to read (and to assert against).
    { label: "Confirm & pay", done: false },
  ];
  const activeIndex = feesApproved ? 1 : 0;

  return (
    <ol className="flex items-center gap-2 text-xs" aria-label="Payment steps">
      {steps.map((step, index) => (
        <li key={step.label} className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
              step.done
                ? "bg-[var(--chip-available-bg)] text-[var(--chip-available-fg)]"
                : index === activeIndex
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
            )}
            aria-hidden="true"
          >
            {step.done ? <Check className="h-3 w-3" /> : index + 1}
          </span>
          <span
            className={
              index === activeIndex ? "font-medium" : "text-muted-foreground"
            }
          >
            {step.label}
          </span>
          {index === 0 && (
            <span className="w-6 h-px bg-border ml-1" aria-hidden="true" />
          )}
        </li>
      ))}
    </ol>
  );
}

export function DomainPayment({ domain, mode, onSuccess }: DomainPaymentProps) {
  const {
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
  } = useDomainPayment({ domain, mode, onSuccess });

  const decrementYears = useCallback(
    () => setYears((y) => Math.max(1, y - 1)),
    [setYears],
  );
  const incrementYears = useCallback(() => setYears((y) => y + 1), [setYears]);

  return (
    <Card className="w-full max-w-lg content checkout glass-panel border-primary/20 shadow-[0_0_60px_var(--glow)]">
      <CardHeader className="gap-3">
        <CardTitle>
          {mode === "register" ? "Register" : "Renew"}{" "}
          <span className="text-primary-glow break-all">{domain}</span>
        </CardTitle>
        {address && <StepIndicator feesApproved={feesApproved} />}
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {address && (
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-medium">Years</span>
              <span className="text-xs text-muted-foreground">
                How long to keep the name
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                aria-label="remove-year"
                disabled={years <= 1}
                onClick={decrementYears}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-20 text-center font-medium tabular-nums">
                {years} {years === 1 ? "year" : "years"}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label="add-year"
                onClick={incrementYears}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        {loadingFees && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Fetching current price...
          </div>
        )}
        {fees && (
          <div className="flex flex-col gap-2 py-4 px-4 -mx-2 rounded-xl bg-[hsl(0_0%_100%/0.04)] border border-border/60">
            <div className="flex justify-between text-sm gap-4">
              <span className="text-muted-foreground">
                1 year registration for {domainCharCount} chars
              </span>
              <span className="tabular-nums shrink-0">
                {fees.feesLabel} {fees.symbol}
              </span>
            </div>
            <div className="flex justify-between text-sm gap-4">
              <span className="text-muted-foreground">Duration</span>
              <span className="tabular-nums shrink-0">× {years}</span>
            </div>
            <div className="h-px bg-border/60 my-1" aria-hidden="true" />
            <div className="flex justify-between text-base font-bold gap-4">
              <span>Total (excluding network fees)</span>
              <span className="tabular-nums shrink-0 text-primary-glow">
                {total} {fees.symbol}
              </span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="font-medium">Pay with</span>
          <Select
            value={selectedCoin}
            onValueChange={(v) => setSelectedCoin(v as SdkBYOCSymbol)}
          >
            <SelectTrigger
              aria-label="Payment token"
              data-testid="payment-token-select"
              className="w-40"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableCoins.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <RequireWalletConnection address={address}>
          <div className="flex flex-col gap-3">
            <LoadingButton
              data-testid="approve-fees"
              variant="outline"
              disabled={feesApproved}
              onClick={handleApproveFees}
              loadingText="Approving..."
            >
              {feesApproved ? "Fees approved ✓" : "Approve fees"}
            </LoadingButton>
            <LoadingButton
              disabled={!feesApproved}
              onClick={handleSubmit}
              loadingText={
                mode === "register" ? "Registering..." : "Renewing..."
              }
              className="w-full shadow-[0_0_24px_var(--glow)]"
            >
              {mode === "register" ? "Register domain" : "Renew domain"}
            </LoadingButton>
            {!feesApproved && (
              <p className="text-xs text-muted-foreground text-center">
                Approve the fee transfer first — it unlocks the final
                confirmation.
              </p>
            )}
          </div>
        </RequireWalletConnection>
      </CardContent>
    </Card>
  );
}
