"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Records } from "@/components/records";
import { GoBackButton } from "@/components/go-back-button";
import { ConnectionRequired } from "@/components/connection-required";
import { useSdkStore } from "@/lib/stores/sdk-store";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { type RecordRepository } from "@/lib/types";
import { normalizeDomain } from "@/lib/domain-validator";
import { Loader2 } from "lucide-react";

export default function RecordsPage() {
  const { name } = useParams<{ name: string }>();
  const metaNamesSdk = useSdkStore((s) => s.metaNamesSdk);
  const address = useWalletStore((s) => s.address);
  const [domain, setDomain] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const domainName = normalizeDomain(decodeURIComponent(name));

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!metaNamesSdk) return;
      setLoading(true);
      try {
        const result = await metaNamesSdk.domainRepository.find(domainName);
        if (signal?.aborted) return;
        setDomain(result);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [metaNamesSdk, domainName],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  if (loading)
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <GoBackButton />
      <h2 className="text-2xl font-bold">Records — {domainName}</h2>
      <ConnectionRequired address={address}>
        {domain !== null && (
          <Records
            records={
              (domain as { records?: Record<string, string> }).records ?? {}
            }
            repository={(
              domain as {
                getRecordRepository: (sdk: unknown) => RecordRepository;
              }
            ).getRecordRepository(metaNamesSdk)}
            onUpdate={load}
          />
        )}
      </ConnectionRequired>
    </div>
  );
}
