import { getServerSdk } from "@/lib/sdk";
import type { Domain as DomainType } from "@/lib/types";

export async function getTldData(): Promise<DomainType> {
  "use server";
  const sdk = getServerSdk();
  const contractAddress = sdk.config.contractAddress;
  const domain = await (
    sdk.domainRepository.find as (name: string) => Promise<{
      name: string;
      tld: string;
      owner: string;
      tokenId: number;
      createdAt: Date;
      expiresAt?: Date;
      parentId?: string;
      records: Record<string, string>;
    } | null>
  )("mpc.mpc");
  if (domain) {
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
      records: domain.records,
    };
  }
  return {
    name: "mpc.mpc",
    nameWithoutTLD: "mpc",
    owner: contractAddress,
    tokenId: 0,
    createdAt: new Date(),
    expiresAt: null,
    parentId: null,
    records: {},
  };
}
