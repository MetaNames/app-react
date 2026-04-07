import { WalletConnectButton } from "@/components/wallet-connect-button";

interface RequireWalletConnectionProps {
  children: React.ReactNode;
  address: string | undefined;
}

export function RequireWalletConnection({
  children,
  address,
}: RequireWalletConnectionProps) {
  if (!address) {
    return (
      <div className="flex flex-col gap-3">
        <WalletConnectButton />
      </div>
    );
  }

  return <>{children}</>;
}
