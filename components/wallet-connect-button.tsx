"use client";
import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Wallet, LogOut } from "lucide-react";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { useSdkStore } from "@/lib/stores/sdk-store";
import {
  shortenAddress,
  validatePrivateKey,
  connectMetaMask,
  connectPartisiaWallet,
  connectLedger,
  connectDevPrivateKey,
  disconnectWallet,
} from "@/lib/wallet";
import { config } from "@/lib/config";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";

export function WalletConnectButton() {
  const address = useWalletStore((s) => s.address);
  const setAddress = useWalletStore((s) => s.setAddress);
  const metaNamesSdk = useSdkStore((s) => s.metaNamesSdk);
  const [devKey, setDevKey] = useState("");
  const [open, setOpen] = useState(false);
  const [mounted] = useState(true);
  const isValidKey = useMemo(() => validatePrivateKey(devKey), [devKey]);

  const handleConnect = useCallback(
    async (type: "metamask" | "partisia" | "ledger") => {
      if (!metaNamesSdk) return;
      try {
        let addr = "";
        if (type === "metamask") addr = await connectMetaMask(metaNamesSdk);
        else if (type === "partisia")
          addr = await connectPartisiaWallet(metaNamesSdk);
        else if (type === "ledger") addr = await connectLedger(metaNamesSdk);
        setAddress(addr);
        setOpen(false);
        toast.success("Wallet connected");
      } catch (e) {
        // Reported to Sentry — unlike the dev private-key path below, these
        // connectors never see a secret, so the failure context is safe to send.
        console.error(e);
        Sentry.captureException(e, { extra: { wallet: type } });
        toast.error((e as Error)?.message ?? "Failed to connect wallet");
      }
    },
    [metaNamesSdk, setAddress],
  );

  const handleMetaMask = useCallback(
    () => handleConnect("metamask"),
    [handleConnect],
  );
  const handlePartisia = useCallback(
    () => handleConnect("partisia"),
    [handleConnect],
  );
  const handleLedger = useCallback(
    () => handleConnect("ledger"),
    [handleConnect],
  );

  const handleDevConnect = useCallback(async () => {
    if (!metaNamesSdk) {
      toast.error("SDK not ready, please wait...");
      return;
    }
    if (!isValidKey) return;
    try {
      const addr = await connectDevPrivateKey(metaNamesSdk, devKey);
      setAddress(addr);
      setOpen(false);
      toast.success("Dev wallet connected");
    } catch (e) {
      // Deliberately not sent to Sentry: the failure context would carry the
      // dev private key, which must never leave the device.
      console.error(e);
      toast.error((e as Error)?.message ?? "Failed to connect");
    }
  }, [metaNamesSdk, devKey, isValidKey, setAddress]);

  const handleDisconnect = useCallback(() => {
    if (metaNamesSdk) disconnectWallet(metaNamesSdk);
    setAddress(undefined);
    setOpen(false);
    toast.success("Wallet disconnected");
  }, [metaNamesSdk, setAddress]);

  if (address) {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          className="focus-ring gap-2 border border-primary/40 bg-primary/10 hover:bg-primary/20 text-foreground rounded-xl px-3 py-2 text-sm font-medium transition-colors"
          data-testid="wallet-connected"
        >
          <Wallet className="h-4 w-4" />
          {shortenAddress(address)}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border border-foreground/15 bg-popover shadow-xl shadow-black/60 ring-0 backdrop-blur-none"
        >
          <DropdownMenuItem
            onClick={handleDisconnect}
            className="gap-2 px-2.5 py-2 text-destructive"
          >
            <LogOut className="h-4 w-4" /> Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className="focus-ring inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-4 py-2 text-sm font-semibold shadow-[0_0_20px_var(--glow)] hover:shadow-[0_0_32px_var(--glow)] transition-shadow"
        data-testid="wallet-connect-button"
      >
        <Wallet className="h-4 w-4 shrink-0" /> Connect
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 border border-foreground/15 bg-popover shadow-xl shadow-black/60 ring-0 backdrop-blur-none"
      >
        <div className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
          Connect a wallet
        </div>
        <DropdownMenuItem className="px-2.5 py-2" onClick={handleMetaMask}>
          MetaMask Wallet
        </DropdownMenuItem>
        <DropdownMenuItem className="px-2.5 py-2" onClick={handlePartisia}>
          Partisia Wallet
        </DropdownMenuItem>
        <DropdownMenuItem className="px-2.5 py-2" onClick={handleLedger}>
          Ledger
        </DropdownMenuItem>
        {mounted && config.isTestnet && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 flex flex-col gap-2">
              <span className="px-0.5 text-xs font-medium text-muted-foreground">
                Testnet dev key
              </span>
              <Input
                data-testid="dev-key-input"
                className="dev-key-input border-border bg-background text-xs placeholder:text-muted-foreground"
                placeholder="64-char hex private key"
                value={devKey}
                onChange={(e) => setDevKey(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
              />
              <Button
                size="sm"
                className="dev-key-connect w-full"
                disabled={!isValidKey}
                onClick={handleDevConnect}
                data-testid="dev-key-connect-button"
              >
                Connect Dev Key
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
