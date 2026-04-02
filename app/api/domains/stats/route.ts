import { NextResponse } from 'next/server';
import { MetaNamesSdk, Enviroment } from '@metanames/sdk';
export async function GET() {
  try {
    const sdk = new MetaNamesSdk(process.env.NEXT_PUBLIC_ENV !== 'prod' ? Enviroment.testnet : Enviroment.mainnet);
    let domainCount = 0, ownerCount = 0, recentDomains: any[] = [];
    try {
      const domains = await sdk.domainRepository.getAll();
      if (domains) { domainCount = domains.length; ownerCount = new Set(domains.map((d: any) => d.owner)).size; }
    } catch {}
    try {
      const all = await sdk.domainRepository.getAll();
      if (all) {
        recentDomains = [...all].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
      }
    } catch {}
    return NextResponse.json({ domainCount, ownerCount, recentDomains }, { headers: { 'Cache-Control': 'public, s-maxage=600' } });
  } catch { return NextResponse.json({ domainCount: 0, ownerCount: 0, recentDomains: [] }); }
}
