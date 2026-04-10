import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getDomainData } from "@/lib/data/domain";
import { normalizeDomain } from "@/lib/domain-validator";
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
  const domain = await getDomainData(domainName);

  if (!domain) {
    const registerDomain = domainName.replace(".mpc", "");
    redirect(`/register/${registerDomain}`);
  }

  return <DomainPageClient initialDomain={domain} />;
}

export default async function DomainPage({ params }: PageProps) {
  const { name } = await params;
  const domainName = normalizeDomain(decodeURIComponent(name));

  return (
    <Suspense fallback={<Loading />}>
      <DomainPageContent domainName={domainName} />
    </Suspense>
  );
}
