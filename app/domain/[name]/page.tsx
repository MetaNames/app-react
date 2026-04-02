'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Domain } from '@/components/domain';
import { useSdkStore } from '@/lib/stores/sdk-store';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { normalizeDomain } from '@/lib/domain-validator';

export default function DomainPage() {
  const { name } = useParams<{ name: string }>();
  const router = useRouter();
  const { metaNamesSdk } = useSdkStore();
  const refresh = useWalletStore((s) => s.refresh);
  const [domain, setDomain] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!metaNamesSdk) return;
    setLoading(true);
    try {
      const domainName = normalizeDomain(decodeURIComponent(name));
      const d = await metaNamesSdk.domainRepository.find(domainName);
      if (!d) {
        toast.error('Domain not found. Register it now!');
        router.replace(`/register/${domainName.replace(/\.mpc$/, '')}`);
        return;
      }
      setDomain(d);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [name, metaNamesSdk, refresh]);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!domain) return null;
  return <Domain domain={domain} onRefresh={load} />;
}