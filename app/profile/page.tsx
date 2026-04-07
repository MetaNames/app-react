import { ProfilePageClient } from "./ProfilePageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address?: string }>;
}) {
  const { address } = await params;
  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Profile";
  return {
    title: `${displayAddress} - MetaNames`,
    description: address
      ? `View domain portfolio for ${displayAddress}`
      : "View your domain portfolio",
  };
}

export default async function ProfilePage({
  params: _params,
}: {
  params: Promise<{ address?: string }>;
}) {
  return <ProfilePageClient />;
}
