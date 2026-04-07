"use client";
import { Wallet } from "lucide-react";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { shortenAddress } from "@/lib/wallet";

export function WalletConnectStatus() {
  const { address } = useWalletStore();

  if (!address) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Wallet className="h-4 w-4" />
      <span>{shortenAddress(address)}</span>
    </div>
  );
}
