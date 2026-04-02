'use client';
import { useWalletStore } from '@/lib/stores/wallet-store';
export function ConnectionRequired({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const address = useWalletStore((s) => s.address);
  if (!address) return fallback ? <>{fallback}</> : (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
      <p className="text-muted-foreground text-lg">Connect your wallet to continue</p>
    </div>
  );
  return <>{children}</>;
}
