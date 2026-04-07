"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DomainPayment } from "@/components/domain-payment";
import { SubdomainRegistration } from "@/components/subdomain-registration";
import { ConnectionRequired } from "@/components/connection-required";
import { checkDomain } from "@/lib/api";
import { normalizeDomain, parseSubdomain } from "@/lib/domain-validator";
import { Loader2 } from "lucide-react";

function useDomainStatus(domainName: string, isSubdomain: boolean) {
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "available" | "subdomain" | "taken"
  >("loading");

  const checkAndSetStatus = useCallback(async () => {
    const result = await checkDomain(domainName);
    if (result.error) {
      setStatus("available");
      return;
    }
    const { domainPresent, parentPresent } = result.data || {
      domainPresent: false,
      parentPresent: false,
    };
    if (domainPresent) {
      router.replace(`/domain/${domainName}`);
      return;
    }
    if (isSubdomain && parentPresent) setStatus("subdomain");
    else setStatus("available");
  }, [domainName, isSubdomain, router]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => checkAndSetStatus(), 0);
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [checkAndSetStatus]);

  return status;
}

export function RegisterPageClient({ name }: { name: string }) {
  const domainName = normalizeDomain(decodeURIComponent(name));
  const { isSubdomain, parent } = parseSubdomain(domainName);
  const status = useDomainStatus(domainName, isSubdomain);

  if (status === "loading")
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="flex flex-col items-start gap-6 content checkout">
      <h2 className="text-2xl font-bold">Register {domainName}</h2>
      <ConnectionRequired>
        {status === "subdomain" && parent ? (
          <SubdomainRegistration domain={domainName} parentDomain={parent} />
        ) : (
          <DomainPayment domain={domainName} mode="register" />
        )}
      </ConnectionRequired>
    </div>
  );
}
