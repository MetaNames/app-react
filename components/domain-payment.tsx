'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingButton } from '@/components/loading-button';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useSdkStore } from '@/lib/stores/sdk-store';
import { fetchRegistrationFees } from '@/lib/api';
import { getAccountBalance } from '@/lib/sdk';
import { InsufficientBalanceError, isInsufficientBalanceError } from '@/lib/error';
import { bridgeUrl, explorerTransactionUrl } from '@/lib/url';
import { BYOC_SYMBOLS, type BYOCSymbol, type FeesResponse } from '@/lib/types';
import { Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface DomainPaymentProps { domain: string; mode: 'register' | 'renew'; onSuccess?: () => void; }

export function DomainPayment({ domain, mode, onSuccess }: DomainPaymentProps) {
  const router = useRouter();
  const { address } = useWalletStore();
  const { metaNamesSdk, selectedCoin, setSelectedCoin } = useSdkStore();
  const [years, setYears] = useState(1);
  const [fees, setFees] = useState<FeesResponse | null>(null);
  const [feesApproved, setFeesApproved] = useState(false);
  const [loadingFees, setLoadingFees] = useState(false);

  useEffect(() => {
    if (!address) return;
    setLoadingFees(true);
    setFeesApproved(false);
    fetchRegistrationFees(domain, selectedCoin).then(setFees).finally(() => setLoadingFees(false));
  }, [domain, selectedCoin, address]);

  const handleApproveFees = async () => {
    if (!metaNamesSdk || !address || !fees) return;
    try {
      const balance = await getAccountBalance(metaNamesSdk, address, selectedCoin);
      const total = (fees.fees || 0) * years;
      if (balance < total) throw new InsufficientBalanceError(selectedCoin);
      const intent = await metaNamesSdk.domainRepository.approveMintFees(domain, selectedCoin, years);
      const txHash = await intent.send();
      toast('New Transaction submitted', { action: { label: 'View', onClick: () => window.open(explorerTransactionUrl(txHash), '_blank') }, duration: 10000 });
      await intent.waitForConfirmation();
      setFeesApproved(true);
    } catch (e) {
      if (isInsufficientBalanceError(e)) {
        toast(`Insufficient balance for ${e.coin}`, {
          duration: 5000,
          action: { label: 'Add funds', onClick: () => window.open(bridgeUrl(), '_blank') },
        });
      } else {
        throw e;
      }
    }
  };

  const handleSubmit = async () => {
    if (!metaNamesSdk || !address) return;
    let intent;
    if (mode === 'register') {
      intent = await metaNamesSdk.domainRepository.register({ domain, to: address, subscriptionYears: years, byocSymbol: selectedCoin });
    } else {
      intent = await metaNamesSdk.domainRepository.renew({ domain, payer: address, byocSymbol: selectedCoin, subscriptionYears: years });
    }
    const txHash = await intent.send();
    toast('New Transaction submitted', { action: { label: 'View', onClick: () => window.open(explorerTransactionUrl(txHash), '_blank') }, duration: 10000 });
    await intent.waitForConfirmation();
    const msg = mode === 'register' ? 'Domain registered successfully!' : 'Domain renewed successfully!';
    toast.success(msg, { action: { label: 'Go to profile', onClick: () => router.push('/profile') } });
    if (onSuccess) onSuccess(); else router.push(`/domain/${domain}`);
  };

  const total = fees ? (parseFloat(String(fees.feesLabel)) * years).toFixed(4) : '—';
  const domainCharCount = domain.replace(/\.mpc$/, '').split('.')[0].length;

  return (
    <Card className="w-full max-w-lg content checkout">
      <CardHeader><CardTitle>{mode === 'register' ? 'Register' : 'Renew'} {domain}</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <span className="font-medium">Duration</span>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" aria-label="remove-year" disabled={years <= 1} onClick={() => setYears(y => Math.max(1, y - 1))}><Minus className="h-4 w-4" /></Button>
            <span className="w-20 text-center font-medium">{years} {years === 1 ? 'year' : 'years'}</span>
            <Button variant="outline" size="icon" aria-label="add-year" onClick={() => setYears(y => y + 1)}><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
        {address && (
          <div className="flex items-center justify-between">
            <span className="font-medium">Pay with</span>
            <Select value={selectedCoin} onValueChange={(v) => setSelectedCoin(v as BYOCSymbol)}>
              <SelectTrigger data-testid="payment-token-select" className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{BYOC_SYMBOLS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
        {address && fees && (
          <div className="flex flex-col gap-2 py-3 border-t border-b">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">1 year registration for {domainCharCount} chars</span><span>{fees.feesLabel} {fees.symbol}</span></div>
            <div className="flex justify-between font-medium"><span>Total (excluding network fees)</span><span>{total} {fees.symbol}</span></div>
          </div>
        )}
        {address && (
          <div className="flex flex-col gap-3">
            <LoadingButton data-testid="approve-fees" variant="outline" disabled={feesApproved} onClick={handleApproveFees} loadingText="Approving...">
              {feesApproved ? 'Fees approved ✓' : 'Approve fees'}
            </LoadingButton>
            <LoadingButton disabled={!feesApproved} onClick={handleSubmit} loadingText={mode === 'register' ? 'Registering...' : 'Renewing...'} className="w-full">
              {mode === 'register' ? 'Register domain' : 'Renew domain'}
            </LoadingButton>
          </div>
        )}
      </CardContent>
    </Card>
  );
}