import { RegisterPageClient } from "./RegisterPageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const domainName = decodeURIComponent(name);
  return {
    title: `Register ${domainName} - MetaNames`,
    description: `Register ${domainName} domain on MetaNames`,
  };
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  return <RegisterPageClient name={name} />;
}
