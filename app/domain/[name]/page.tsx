import { DomainPageClient } from "./DomainPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const domainName = decodeURIComponent(name);
  return {
    title: `${domainName} - MetaNames`,
    description: `View and manage ${domainName} domain on MetaNames`,
  };
}

export default async function DomainPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  return <DomainPageClient name={name} />;
}
