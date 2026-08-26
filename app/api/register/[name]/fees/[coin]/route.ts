import { NextRequest, NextResponse } from "next/server";
import type { BYOCSymbol } from "@metanames/sdk/dist/providers/config";
import { getServerSdk } from "@/lib/sdk";
import { handleError, jsonError } from "@/lib/server-error";
import { validateDomainName, normalizeDomain } from "@/lib/domain-validator";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string; coin: string }> },
) {
  const { name, coin } = await params;

  const domainValidation = validateDomainName(name);
  if (!domainValidation.valid) {
    return jsonError(400, domainValidation.error ?? "Invalid domain name");
  }

  return handleError(async () => {
    const sdk = getServerSdk();
    const domainName = normalizeDomain(name);

    // The BYOC symbols differ per environment (testnet exposes TEST_COIN and
    // ETH_GOERLI, mainnet its own set), so the supported list has to come from
    // the SDK's config rather than a hardcoded allowlist.
    const availableCoins =
      (sdk.config.byoc?.map((b) => b.symbol) as BYOCSymbol[]) ?? [];
    if (!availableCoins.includes(coin as BYOCSymbol)) {
      return jsonError(400, "Unsupported coin symbol");
    }

    const fees = await sdk.domainRepository.calculateMintFees(
      domainName,
      coin as BYOCSymbol,
    );
    if (!fees) return jsonError(404, "Not found");

    return NextResponse.json({
      feesLabel: fees.feesLabel,
      fees: fees.fees,
      symbol: fees.symbol,
      address: fees.address,
    });
  });
}
