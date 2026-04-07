import { getServerSdk } from "@/lib/sdk";
import type { Domain as DomainType } from "@/lib/types";

export async function getProfileDomains(
  address: string,
): Promise<DomainType[]> {
  "use server";
  const sdk = getServerSdk();
  const domains = await (
    sdk.domainRepository.findByOwner as (addr: string) => Promise<
      Array<{
        name: string;
        tld: string;
        owner: string;
        tokenId: number;
        createdAt: Date;
        expiresAt?: Date;
        parentId?: string;
        records: Record<string, string>;
      }>
    >
  )(address);
  return domains.map((domain) => ({
    name: domain.name,
    nameWithoutTLD: domain.tld
      ? domain.name.replace(`.${domain.tld}`, "")
      : domain.name,
    owner: domain.owner,
    tokenId: domain.tokenId,
    createdAt: domain.createdAt,
    expiresAt: domain.expiresAt ?? null,
    parentId: domain.parentId ?? null,
    records: domain.records,
  }));
}
