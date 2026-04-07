import { getServerSdk } from "@/lib/sdk";
import type { Domain as DomainType } from "@/lib/types";

export async function getDomainData(name: string): Promise<DomainType | null> {
  "use server";
  const domainName = decodeURIComponent(name);
  const sdk = getServerSdk();
  const domain = await sdk.domainRepository.find(domainName);
  if (!domain) return null;
  return {
    name: domain.name,
    nameWithoutTLD: domain.tld
      ? domain.name.replace(`.${domain.tld}`, "")
      : domain.name,
    owner: domain.owner,
    tokenId: domain.tokenId,
    createdAt: domain.createdAt,
    expiresAt: domain.expiresAt ?? null,
    parentId: domain.parentId ?? null,
    records: domain.records as Record<string, string>,
  };
}
