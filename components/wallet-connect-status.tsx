import { Wallet } from "lucide-react";
import { shortenAddress } from "@/lib/wallet";

interface WalletConnectStatusProps {
  address: string | undefined;
}

export function WalletConnectStatus({ address }: WalletConnectStatusProps) {
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
