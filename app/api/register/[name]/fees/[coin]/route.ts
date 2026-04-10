import { NextRequest, NextResponse } from "next/server";
import { MetaNamesSdk, Enviroment } from "@metanames/sdk";
import type { BYOCSymbol } from "@metanames/sdk/dist/providers/config";
import { validateDomainName } from "@/lib/domain-validator";

function getSdk() {
  const sdk = new MetaNamesSdk(
    process.env.NEXT_PUBLIC_ENV !== "prod"
      ? Enviroment.testnet
      : Enviroment.mainnet,
  );
  return sdk;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string; coin: string }> },
) {
  const { name, coin } = await params;
  const sdk = getSdk();
  const domainName = name.endsWith(".mpc") ? name : `${name}.mpc`;

  const domainValidation = validateDomainName(name);
  if (!domainValidation.valid) {
    return NextResponse.json(
      { error: domainValidation.error },
      { status: 400 },
    );
  }

  const totalLength = domainName.length;
  if (totalLength > 64) {
    return NextResponse.json(
      { error: "Domain name is too long" },
      { status: 400 },
    );
  }

  const availableCoins =
    (sdk.config.byoc?.map((b) => b.symbol) as BYOCSymbol[]) ?? [];
  if (!availableCoins.includes(coin as BYOCSymbol)) {
    return NextResponse.json(
      { error: "Unsupported coin symbol" },
      { status: 400 },
    );
  }

  try {
    const fees = await sdk.domainRepository.calculateMintFees(
      domainName,
      coin as BYOCSymbol,
    );
    if (!fees)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      feesLabel: fees.feesLabel,
      fees: fees.fees,
      symbol: fees.symbol,
      address: fees.address,
    });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Failed";
    if (message.includes("Domain name is too long")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
