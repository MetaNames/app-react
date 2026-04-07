import { NextResponse } from "next/server";
import { MetaNamesSdk, Enviroment } from "@metanames/sdk";
import type { Domain } from "@metanames/sdk/dist/models/domain";
export async function GET() {
  try {
    const sdk = new MetaNamesSdk(
      process.env.NEXT_PUBLIC_ENV !== "prod"
        ? Enviroment.testnet
        : Enviroment.mainnet,
    );
    const all = await sdk.domainRepository.getAll();
    const recent = all
      ? [...all]
          .sort(
            (a: Domain, b: Domain) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .slice(0, 10)
      : [];
    return NextResponse.json(recent, {
      headers: { "Cache-Control": "public, s-maxage=600" },
    });
  } catch {
    return NextResponse.json([]);
  }
}
