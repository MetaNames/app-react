"use client";
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
import { Minus, Plus, Loader2 } from "lucide-react";
import type { BYOCSymbol as SdkBYOCSymbol } from "@metanames/sdk/dist/providers/config";

interface DomainPaymentProps {
  domain: string;
  mode: "register" | "renew";
  onSuccess?: () => void;
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

  return (
    <Card className="w-full max-w-lg content checkout">
      <CardHeader>
        <CardTitle>
          {mode === "register" ? "Register" : "Renew"} {domain}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <span className="font-medium">Duration</span>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              aria-label="remove-year"
              disabled={years <= 1}
              onClick={() => setYears((y) => Math.max(1, y - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-20 text-center font-medium">
              {years} {years === 1 ? "year" : "years"}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="add-year"
              onClick={() => setYears((y) => y + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {loadingFees && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {fees && (
          <div className="flex flex-col gap-2 py-3 border-t border-b">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                1 year registration for {domainCharCount} chars
              </span>
              <span>
                {fees.feesLabel} {fees.symbol}
              </span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total (excluding network fees)</span>
              <span>
                {total} {fees.symbol}
              </span>
            </div>
          </div>
        )}
        {address && (
          <div className="flex items-center justify-between">
            <span className="font-medium">Pay with</span>
            <Select
              value={selectedCoin}
              onValueChange={(v) => setSelectedCoin(v as SdkBYOCSymbol)}
            >
              <SelectTrigger
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
        )}
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
              className="w-full"
            >
              {mode === "register" ? "Register domain" : "Renew domain"}
            </LoadingButton>
          </div>
        </RequireWalletConnection>
      </CardContent>
    </Card>
  );
}
