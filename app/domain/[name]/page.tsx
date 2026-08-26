import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getDomainData } from "@/lib/data/domain";
import { normalizeDomain } from "@/lib/domain-validator";
import { loadOrReport } from "@/lib/load-error";
import { DomainLoadError } from "./DomainLoadError";
import { DomainPageClient } from "./DomainPageClient";
import Loading from "./loading";

interface PageProps {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { name } = await params;
  const domainName = decodeURIComponent(name);
  return {
    title: `${domainName} - MetaNames`,
    description: `View domain information for ${domainName}`,
  };
}

async function DomainPageContent({ domainName }: { domainName: string }) {
  // A load failure (network/API error) is not the same as a confirmed
  // absence: the former should send the user home with an alert, the
  // latter should send them to register the domain. Letting an error
  // silently resolve to "not found" would misdirect the user, and letting
  // it escape uncaught would surface Next's generic error boundary instead
  // of a graceful redirect.
  const result = await loadOrReport(
    getDomainData(domainName),
    "Could not load the domain. Please try again.",
  );

  if (!result.ok) {
    return <DomainLoadError message={result.message} />;
  }

  if (!result.value) {
    const registerDomain = domainName.replace(".mpc", "");
    redirect(`/register/${registerDomain}`);
  }

  return <DomainPageClient initialDomain={result.value} />;
}

export default async function DomainPage({ params }: PageProps) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  // Canonicalize mixed-case URLs to lowercase before anything else, mirroring
  // legacy's redirect-to-lowercase behaviour, so `/domain/Alice.mpc` and
  // `/domain/alice.mpc` resolve to the same canonical route.
  const lowered = decoded.toLowerCase();
  if (lowered !== decoded) {
    redirect(`/domain/${encodeURIComponent(lowered)}`);
  }
  const domainName = normalizeDomain(lowered);

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 py-12">
      <Suspense fallback={<Loading />}>
        <DomainPageContent domainName={domainName} />
      </Suspense>
    </div>
  );
}
