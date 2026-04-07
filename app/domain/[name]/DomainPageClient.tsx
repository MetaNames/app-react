"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Domain } from "@/components/domain";
import { type Domain as DomainType } from "@/lib/types";
import { useSdkStore } from "@/lib/stores/sdk-store";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { normalizeDomain } from "@/lib/domain-validator";

export function DomainPageClient({ name }: { name: string }) {
  const router = useRouter();
  const metaNamesSdk = useSdkStore((s) => s.metaNamesSdk);
  const lastRefreshed = useWalletStore((s) => s.lastRefreshed);
  const [domain, setDomain] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  const load = useCallback(async () => {
    if (!metaNamesSdk) return;
    // Only set loading true if not already loading (for refresh scenarios)
    setLoading((prev) => (prev ? prev : true));
    try {
      const domainName = normalizeDomain(decodeURIComponent(name));
      const d = await metaNamesSdk.domainRepository.find(domainName);
      if (!d) {
        toast.error("Domain not found. Register it now!");
        router.replace(`/register/${domainName.replace(/\.mpc$/, "")}`);
        setLoading(false);
        return;
      }
      startTransition(() => {
        setDomain(d);
        setLoading(false);
      });
    } catch {
      setLoading(false);
    }
  }, [metaNamesSdk, name, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load, lastRefreshed]);

  if (loading)
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  if (!domain) return null;
  return <Domain domain={domain as DomainType} onRefresh={load} />;
}
