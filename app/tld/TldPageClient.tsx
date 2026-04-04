'use client';
import { useEffect, useState } from 'react';
import { Domain } from '@/components/domain';
import { useSdkStore } from '@/lib/stores/sdk-store';
import { Loader2 } from 'lucide-react';

export function TldPageClient() {
  const { metaNamesSdk } = useSdkStore();
  const [tldDomain, setTldDomain] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!metaNamesSdk) return;
    const contractAddress = metaNamesSdk.config.contractAddress;
    (metaNamesSdk.domainRepository.find as any)('mpc.mpc')
      .then((d: any) => setTldDomain(d ?? { name: 'mpc', nameWithoutTLD: 'mpc', owner: contractAddress, tokenId: 0, createdAt: new Date(), expiresAt: null, parentId: null, records: {}, getRecordRepository: () => null }))
      .catch((e: unknown) => { console.error('Error fetching TLD:', e); })
      .finally(() => setLoading(false));
  }, [metaNamesSdk]);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading TLD information" /></div>;
  if (!tldDomain) return <p className="text-muted-foreground">TLD information unavailable.</p>;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">TLD Information</h1>
      <Domain domain={tldDomain} isTld={true} />
    </div>
  );
}