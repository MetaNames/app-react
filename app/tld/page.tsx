import { getServerSdk } from "@/lib/sdk";
import { TldPageClient } from "./TldPageClient";
import type { Domain } from "@/lib/types";
import type { Domain as SdkDomain } from "@metanames/sdk/dist/models/domain";

export const metadata = {
  title: "TLD Information - MetaNames",
  description: "View Top-Level Domain information",
};

function convertSdkDomain(sdkDomain: SdkDomain): Domain {
  return {
    name: sdkDomain.name,
    nameWithoutTLD: sdkDomain.nameWithoutTLD,
    owner: sdkDomain.owner,
    tokenId: sdkDomain.tokenId,
    createdAt: sdkDomain.createdAt,
    expiresAt: sdkDomain.expiresAt ?? null,
    parentId: sdkDomain.parentId ?? null,
    records: sdkDomain.records as Record<string, string>,
  };
}

export default async function TldPage() {
  const sdk = getServerSdk();
  const sdkDomain = await sdk.domainRepository.find("mpc.mpc");

  const tldDomain: Domain = sdkDomain
    ? convertSdkDomain(sdkDomain)
    : {
        name: "mpc",
        nameWithoutTLD: "mpc",
        owner: sdk.config.contractAddress,
        tokenId: 0,
        createdAt: new Date(),
        expiresAt: null,
        parentId: null,
        records: {},
      };

  return <TldPageClient initialDomain={tldDomain} />;
}
