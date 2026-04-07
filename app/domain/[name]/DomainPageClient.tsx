"use client";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Domain } from "@/components/domain";
import { type Domain as DomainType } from "@/lib/types";
import { useSdkStore } from "@/lib/stores/sdk-store";
import { toast } from "sonner";

interface DomainPageClientProps {
  initialDomain: DomainType;
}

export function DomainPageClient({ initialDomain }: DomainPageClientProps) {
  const router = useRouter();
  const metaNamesSdk = useSdkStore((s) => s.metaNamesSdk);
  const [domain, setDomain] = useState<DomainType>(initialDomain);
  const [, startTransition] = useTransition();

  const handleRefresh = useCallback(async () => {
    if (!metaNamesSdk) return;
    try {
      const d = await metaNamesSdk.domainRepository.find(domain.name);
      if (!d) {
        toast.error("Domain not found.");
        router.replace(`/register/${domain.name.replace(/\.mpc$/, "")}`);
        return;
      }
      startTransition(() => {
        setDomain({
          name: d.name,
          nameWithoutTLD: d.nameWithoutTLD,
          owner: d.owner,
          tokenId: d.tokenId,
          createdAt: d.createdAt,
          expiresAt: d.expiresAt ?? null,
          parentId: d.parentId ?? null,
          records: d.records as Record<string, string>,
        });
      });
    } catch {
      toast.error("Failed to refresh domain");
    }
  }, [metaNamesSdk, domain.name, router]);

  return <Domain domain={domain} onRefresh={handleRefresh} />;
}
