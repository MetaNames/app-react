'use client';
import { useParams } from 'next/navigation';
import { DomainPayment } from '@/components/domain-payment';
import { ConnectionRequired } from '@/components/connection-required';
import { GoBackButton } from '@/components/go-back-button';
import { normalizeDomain } from '@/lib/domain-validator';

export default function RenewPage() {
  const { name } = useParams<{ name: string }>();
  const domainName = normalizeDomain(decodeURIComponent(name));
  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div className="flex items-center gap-4"><GoBackButton /><h2 className="text-2xl font-bold">Renew domain</h2></div>
      <ConnectionRequired><DomainPayment domain={domainName} mode="renew" /></ConnectionRequired>
    </div>
  );
}