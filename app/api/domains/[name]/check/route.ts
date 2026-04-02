import { NextRequest, NextResponse } from 'next/server';
import { MetaNamesSdk, Enviroment } from '@metanames/sdk';
function getSdk() {
  const sdk = new MetaNamesSdk(process.env.NEXT_PUBLIC_ENV !== 'prod' ? Enviroment.testnet : Enviroment.mainnet);
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
    const domainPresent = domain != null;
    let parentPresent = false;
    const parts = domainName.replace(/\.mpc$/, '').split('.');
    if (parts.length > 1) {
      const parent = await sdk.domainRepository.find(`${parts.slice(1).join('.')}.mpc`);
      parentPresent = parent != null;
    }
    return NextResponse.json({ domainPresent, parentPresent });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ domainPresent: false, parentPresent: false }, { status: 500 });
  }
}
