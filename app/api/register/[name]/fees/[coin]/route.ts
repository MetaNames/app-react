import { NextRequest, NextResponse } from "next/server";
import { MetaNamesSdk, Enviroment } from "@metanames/sdk";
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
  try {
    const sdk = getSdk();
    const domainName = name.endsWith(".mpc") ? name : `${name}.mpc`;
    const fees = await sdk.domainRepository.calculateMintFees(
      domainName,
      coin as any,
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
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
