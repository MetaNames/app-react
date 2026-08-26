"use client";
import { useEffect, useState, useRef } from "react";
import { DomainsTable } from "@/components/domains-table";
import { Chip } from "@/components/chip";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { useSdkStore } from "@/lib/stores/sdk-store";
import { explorerAddressUrl } from "@/lib/url";
import type { Domain } from "@/lib/types";
import { Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfilePageClient() {
  const address = useWalletStore((s) => s.address);
  const metaNamesSdk = useSdkStore((s) => s.metaNamesSdk);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (!address || !metaNamesSdk) return;

    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    let cancelled = false;

    async function loadDomains() {
      setLoading(true);
      try {
        const result = await (
          metaNamesSdk!.domainRepository.findByOwner as (
            addr: string,
          ) => Promise<Domain[]>
        )(address!);
        if (cancelled) return;
        setDomains(result);
      } catch {
        if (cancelled) return;
        setDomains([]);
      } finally {
        if (!cancelled) setLoading(false);
        isFetchingRef.current = false;
      }
    }

    loadDomains();

    return () => {
      cancelled = true;
    };
  }, [address, metaNamesSdk]);

  if (!address)
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center py-24 gap-4 text-center animate-fade-up"
      >
        <h1 className="sr-only">Profile</h1>
        <span
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary-glow"
          aria-hidden="true"
        >
          <Wallet className="h-6 w-6" />
        </span>
        <p className="text-xl text-muted-foreground">
          Connect your wallet to see your domains
        </p>
        <p className="text-sm text-muted-foreground">
          Use the Connect Wallet button in the top right to get started.
        </p>
      </div>
    );

  return (
    <div className="spotlight-beam flex flex-col gap-8 w-full relative z-10 animate-fade-up py-8">
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-4xl font-extrabold tracking-tight">Profile</h1>
        <Chip
          label="address"
          value={address}
          href={explorerAddressUrl(address)}
        />
      </div>
      <section className="flex flex-col gap-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl font-semibold">Domains</h2>
          {!loading && (
            <span className="text-xs font-mono text-muted-foreground tabular-nums">
              {domains.length}
            </span>
          )}
        </div>
        {loading ? (
          <div
            className="flex flex-col gap-3"
            role="status"
            aria-label="Loading domains"
          >
            <Skeleton className="h-9 w-full max-w-xs rounded-lg" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : (
          <DomainsTable domains={domains} />
        )}
      </section>
    </div>
  );
}
