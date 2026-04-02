'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Wallet, LogOut } from 'lucide-react';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useSdkStore } from '@/lib/stores/sdk-store';
import { shortenAddress, validatePrivateKey, connectMetaMask, connectPartisiaWallet, connectLedger, connectDevPrivateKey, disconnectWallet } from '@/lib/wallet';
import { config } from '@/lib/config';
import { toast } from 'sonner';

export function WalletConnectButton() {
  const { address, setAddress } = useWalletStore();
  const { metaNamesSdk } = useSdkStore();
  const [devKey, setDevKey] = useState('');
  const [open, setOpen] = useState(false);

  const handleConnect = async (type: 'metamask' | 'partisia' | 'ledger') => {
    if (!metaNamesSdk) return;
    try {
      let addr = '';
      if (type === 'metamask') addr = await connectMetaMask(metaNamesSdk);
      else if (type === 'partisia') addr = await connectPartisiaWallet(metaNamesSdk);
      else if (type === 'ledger') addr = await connectLedger(metaNamesSdk);
      setAddress(addr);
      setOpen(false);
      toast.success('Wallet connected');
    } catch (e: any) { toast.error(e?.message ?? 'Failed to connect wallet'); }
  };

  const handleDevConnect = async () => {
    if (!metaNamesSdk || !validatePrivateKey(devKey)) return;
    try {
      const addr = await connectDevPrivateKey(metaNamesSdk, devKey);
      setAddress(addr);
      setOpen(false);
      toast.success('Dev wallet connected');
    } catch (e: any) { toast.error(e?.message ?? 'Failed to connect'); }
  };

  const handleDisconnect = () => {
    if (metaNamesSdk) disconnectWallet(metaNamesSdk);
    setAddress(undefined);
    toast.success('Wallet disconnected');
  };

  if (address) {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger>
          <Button variant="outline" className="gap-2">
            <Wallet className="h-4 w-4" />{shortenAddress(address)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleDisconnect} className="gap-2 text-destructive">
            <LogOut className="h-4 w-4" /> Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger>
          <Button className="gap-2"><Wallet className="h-4 w-4" /> Connect</Button>
        </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onClick={() => handleConnect('metamask')}>MetaMask Wallet</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleConnect('partisia')}>Partisia Wallet</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleConnect('ledger')}>Ledger</DropdownMenuItem>
        {config.isTestnet && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 flex flex-col gap-2">
              <Input className="dev-key-input text-xs" placeholder="64-char hex private key" value={devKey} onChange={(e) => setDevKey(e.target.value)} />
              <Button size="sm" className="dev-key-connect w-full" disabled={!validatePrivateKey(devKey)} onClick={handleDevConnect}>Connect Dev Key</Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
