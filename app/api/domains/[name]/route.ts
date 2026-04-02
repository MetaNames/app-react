import { NextRequest, NextResponse } from 'next/server';
import { MetaNamesSdk, Enviroment } from '@metanames/sdk';
function getSdk() {
  const isTestnet = process.env.NEXT_PUBLIC_ENV !== 'prod';
  const sdk = new MetaNamesSdk(isTestnet ? Enviroment.testnet : Enviroment.mainnet);
  const key = process.env.TESTNET_PRIVATE_KEY;
  if (key) try { sdk.setSigningStrategy('privateKey', key); } catch {}
  return sdk;
}
export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  try {
    const sdk = getSdk();
    const domainName = name.endsWith('.mpc') ? name : `${name}.mpc`;
    const domain = await sdk.domainRepository.find(domainName);
    return NextResponse.json({ domain: domain ? JSON.parse(JSON.stringify(domain)) : null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ domain: null }, { status: 500 });
  }
}
