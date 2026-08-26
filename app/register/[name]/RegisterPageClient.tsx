"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DomainPayment } from "@/components/domain-payment";
import { SubdomainRegistration } from "@/components/subdomain-registration";
import { checkDomain } from "@/lib/api";
import { resultOrReport } from "@/lib/load-error";
import { normalizeDomain, parseSubdomain } from "@/lib/domain-validator";
import { trackLatest } from "@/lib/race";
import { JdenticonAvatar } from "@/components/domain-avatar";
import { Skeleton } from "@/components/ui/skeleton";

function useDomainStatus(
  domainName: string,
  isSubdomain: boolean,
  parent: string | null,
) {
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "available" | "subdomain" | "taken"
  >("loading");
  // A generation counter, not an AbortController: fetch cancellation only
  // stops the network request, it does nothing to stop a stale `await`
  // continuation that was already scheduled before a newer check started
  // (e.g. the route's `name` param changing while a check is in flight).
  // `trackLatest` lets the async function itself detect it's been
  // superseded and bail out before touching state or navigating.
  const latestRef = useRef(trackLatest());

  const checkAndSetStatus = useCallback(async () => {
    const currentId = latestRef.current.next();
    const response = await checkDomain(domainName);
    if (!latestRef.current.check(currentId)) return; // superseded by a newer check

    const result = resultOrReport(
      response,
      "Failed to check domain availability.",
    );
    if (!result.ok) {
      toast.error(result.message);
      router.replace("/");
      return;
    }

    const { domainPresent, parentPresent } = result.value;
    if (domainPresent) {
      router.replace(`/domain/${domainName}`);
      return;
    }
    // Subdomains require their parent domain to already exist; legacy
    // enforces this by bouncing to the parent's own registration page
    // instead of letting the user register an orphaned subdomain.
    if (isSubdomain && !parentPresent && parent) {
      router.replace(`/register/${parent}`);
      return;
    }
    if (isSubdomain && parentPresent) setStatus("subdomain");
    else setStatus("available");
  }, [domainName, isSubdomain, parent, router]);

  useEffect(() => {
    const timeoutId = setTimeout(() => checkAndSetStatus(), 0);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [checkAndSetStatus]);

  return status;
}

export function RegisterPageClient({ name }: { name: string }) {
  const domainName = normalizeDomain(decodeURIComponent(name));
  const { isSubdomain, parent } = parseSubdomain(domainName);
  const status = useDomainStatus(domainName, isSubdomain, parent);

  if (status === "loading")
    return (
      <div
        className="flex flex-col items-center gap-6 max-w-2xl mx-auto px-4 w-full py-8"
        role="status"
        aria-label="Loading the registration form"
      >
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-[420px] w-full max-w-lg rounded-xl" />
      </div>
    );

  return (
    <div className="spotlight-beam flex flex-col items-center gap-6 content checkout max-w-2xl mx-auto px-4 w-full relative z-10 animate-fade-up">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="avatar p-1 rounded-2xl ring-2 ring-primary/40 shadow-[0_0_24px_var(--glow)]">
          <JdenticonAvatar value={domainName} size={56} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight break-all">
          Register <span className="text-primary-glow">{domainName}</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          {status === "subdomain"
            ? "This subdomain is unclaimed and free to mint under its parent."
            : "This name is unclaimed. Pick a duration and a token to mint it."}
        </p>
      </div>
      {status === "subdomain" && parent ? (
        <SubdomainRegistration domain={domainName} parentDomain={parent} />
      ) : (
        <DomainPayment domain={domainName} mode="register" />
      )}
    </div>
  );
}
