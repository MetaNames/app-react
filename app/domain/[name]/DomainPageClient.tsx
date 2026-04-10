"use client";
import { useState, useCallback } from "react";
import { Domain } from "@/components/domain";
import { type Domain as DomainType } from "@/lib/types";
import { useSdkStore } from "@/lib/stores/sdk-store";

interface DomainPageClientProps {
  initialDomain: DomainType;
}

export function DomainPageClient({ initialDomain }: DomainPageClientProps) {
  const [domain, setDomain] = useState(initialDomain);
  const metaNamesSdk = useSdkStore((s) => s.metaNamesSdk);

  const reload = useCallback(async () => {
    if (!metaNamesSdk) return;
    const sdkDomain = await metaNamesSdk.domainRepository.find(domain.name);
    if (!sdkDomain) return;
    setDomain({
      name: sdkDomain.name,
      nameWithoutTLD: sdkDomain.tld
        ? sdkDomain.name.replace(`.${sdkDomain.tld}`, "")
        : sdkDomain.name,
      owner: sdkDomain.owner,
      tokenId: sdkDomain.tokenId,
      createdAt: sdkDomain.createdAt,
      expiresAt: sdkDomain.expiresAt ?? null,
      parentId: sdkDomain.parentId ?? null,
      records: sdkDomain.records as Record<string, string>,
    });
  }, [metaNamesSdk, domain.name]);

  return <Domain domain={domain} onUpdate={reload} />;
}
