"use client";
import { useCallback, useEffect, useState } from "react";
import { Domain } from "@/components/domain";
import { useSdkStore } from "@/lib/stores/sdk-store";
import type { Domain as DomainType } from "@/lib/types";
import { Loader2 } from "lucide-react";

export function TldPageClient() {
  const metaNamesSdk = useSdkStore((s) => s.metaNamesSdk);
  const [tldDomain, setTldDomain] = useState<DomainType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTld = useCallback(
    async (signal: AbortSignal) => {
      if (!metaNamesSdk) return;
      setLoading(true);
      try {
        const contractAddress = metaNamesSdk.config.contractAddress;
        const d = await (
          metaNamesSdk.domainRepository.find as (
            name: string,
          ) => Promise<DomainType | null>
        )("mpc.mpc");
        if (signal.aborted) return;
        setTldDomain(
          d ?? {
            name: "mpc",
            nameWithoutTLD: "mpc",
            owner: contractAddress,
            tokenId: 0,
            createdAt: new Date(),
            expiresAt: null,
            parentId: null,
            records: {},
          },
        );
      } catch (e: unknown) {
        if (signal.aborted) return;
        console.error("Error fetching TLD:", e);
        setError("Failed to load TLD information");
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [metaNamesSdk],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchTld(controller.signal);
    return () => controller.abort();
  }, [fetchTld]);

  if (loading)
    return (
      <div className="flex justify-center py-24">
        <Loader2
          className="h-8 w-8 animate-spin text-primary"
          aria-label="Loading TLD information"
        />
      </div>
    );
  if (error) return <p className="text-destructive">{error}</p>;
  if (!tldDomain)
    return (
      <p className="text-muted-foreground">TLD information unavailable.</p>
    );
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">TLD Information</h1>
      <Domain domain={tldDomain} isTld={true} />
    </div>
  );
}
