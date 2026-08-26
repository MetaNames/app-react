import { ImageResponse } from "next/og";
import { normalizeDomain } from "@/lib/domain-validator";
import { OgCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Register a domain on MetaNames";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const domainName = normalizeDomain(decodeURIComponent(name).toLowerCase());

  // Reaching /register/<name> means the name was not found on-chain, so the
  // card can claim availability without a second lookup.
  return new ImageResponse(
    <OgCard
      name={domainName}
      eyebrow="Unclaimed name"
      badge={{ label: "Available", tone: "available" }}
      detail="Register it on Partisia Blockchain"
    />,
    size,
  );
}
