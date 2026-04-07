"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Records } from "@/components/records";
import { GoBackButton } from "@/components/go-back-button";
import { ConnectionRequired } from "@/components/connection-required";
import { useSdkStore } from "@/lib/stores/sdk-store";
import { type RecordRepository } from "@/lib/types";
import { normalizeDomain } from "@/lib/domain-validator";
import { Loader2 } from "lucide-react";

export default function RecordsPage() {
  const { name } = useParams<{ name: string }>();
  const { metaNamesSdk } = useSdkStore();
  const [domain, setDomain] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const domainName = normalizeDomain(decodeURIComponent(name));

  const load = useCallback(async () => {
    if (!metaNamesSdk) return;
    setLoading(true);
    try {
      setDomain(await metaNamesSdk.domainRepository.find(domainName));
    } finally {
      setLoading(false);
    }
  }, [metaNamesSdk, domainName]);

  useEffect(() => {
    load();
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
      <ConnectionRequired>
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
