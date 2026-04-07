"use client";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { WalletConnectButton } from "@/components/wallet-connect-button";

export function RequireWalletConnection({
  children,
}: {
  children: React.ReactNode;
}) {
  const address = useWalletStore((s) => s.address);

  if (!address) {
    return (
      <div className="flex flex-col gap-3">
        <WalletConnectButton />
      </div>
    );
  }

  return <>{children}</>;
}
