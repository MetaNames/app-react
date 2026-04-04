'use client';
import { useEffect, useState } from 'react';
import { DomainsTable } from '@/components/domains-table';
import { Chip } from '@/components/chip';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useSdkStore } from '@/lib/stores/sdk-store';
import { explorerAddressUrl } from '@/lib/url';
import { Loader2 } from 'lucide-react';

export function ProfilePageClient() {
  const { address } = useWalletStore();
  const { metaNamesSdk } = useSdkStore();
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address || !metaNamesSdk) return;
    setLoading(true);
    (metaNamesSdk.domainRepository.findByOwner as any)(address).then(setDomains).catch(() => setDomains([])).finally(() => setLoading(false));
  }, [address, metaNamesSdk]);

  if (!address) return <div role="status" className="flex flex-col items-center justify-center py-24 gap-4 text-center"><p className="text-xl text-muted-foreground">Connect your wallet to see your domains</p></div>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">Profile</h1>
        <Chip label="address" value={address} href={explorerAddressUrl(address)} />
      </div>
      <section>
        <h2 className="text-xl font-semibold mb-4">Domains</h2>
        {loading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : <DomainsTable domains={domains} />}
      </section>
    </div>
  );
}