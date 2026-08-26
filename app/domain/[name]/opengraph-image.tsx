import { ImageResponse } from "next/og";
import { getDomainData } from "@/lib/data/domain";
import { normalizeDomain } from "@/lib/domain-validator";
import { expiryStatus, formatRelativeExpiry } from "@/lib/expiry";
import { OgCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";
import { formatDate, truncateAddress } from "@/lib/utils";

export const alt = "Domain on MetaNames";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const domainName = normalizeDomain(decodeURIComponent(name).toLowerCase());

  // A card is a nice-to-have on top of a link that already works; a chain read
  // that fails or is slow must degrade to the name-only card rather than
  // breaking the unfurl.
  let detail: string | undefined;
  try {
    const domain = await getDomainData(domainName);
    if (domain) {
      const status = expiryStatus(domain.expiresAt);
      // Relative ("in 9 days") reads better than a date only while the
      // deadline is near; past that, the date itself is the useful fact.
      const expiry =
        status.state === "never"
          ? ""
          : status.state === "expired"
            ? " · Expired"
            : status.state === "soon"
              ? ` · Expires ${formatRelativeExpiry(status)}`
              : ` · Expires ${formatDate(domain.expiresAt)}`;
      detail = `Owned by ${truncateAddress(domain.owner)}${expiry}`;
    }
  } catch {
    detail = undefined;
  }

  return new ImageResponse(
    <OgCard
      name={domainName}
      eyebrow="Domain"
      badge={{ label: "Registered", tone: "neutral" }}
      detail={detail}
    />,
    size,
  );
}
