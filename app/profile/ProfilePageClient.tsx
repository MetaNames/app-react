"use client";
import { useEffect, useState, useRef } from "react";
import { DomainsTable } from "@/components/domains-table";
import { Chip } from "@/components/chip";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { useSdkStore } from "@/lib/stores/sdk-store";
import { explorerAddressUrl } from "@/lib/url";
import type { Domain } from "@/lib/types";
import { Loader2 } from "lucide-react";

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
        className="flex flex-col items-center justify-center py-24 gap-4 text-center"
      >
        <h1 className="sr-only">Profile</h1>
        <p className="text-xl text-muted-foreground">
          Connect your wallet to see your domains
        </p>
      </div>
    );

  return (
    <div className="spotlight-beam flex flex-col gap-8 w-full relative z-10 animate-fade-up">
      <div className="flex items-center gap-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Profile</h1>
        <Chip
          label="address"
          value={address}
          href={explorerAddressUrl(address)}
        />
      </div>
      <section>
        <h2 className="text-xl font-semibold mb-4">Domains</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <DomainsTable domains={domains} />
        )}
      </section>
    </div>
  );
}
