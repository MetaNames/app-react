"use client";
import { useParams } from "next/navigation";
import { DomainPayment } from "@/components/domain-payment";
import { GoBackButton } from "@/components/go-back-button";
import { normalizeDomain } from "@/lib/domain-validator";

export default function RenewPage() {
  const { name } = useParams<{ name: string }>();
  const domainName = normalizeDomain(decodeURIComponent(name));
  return (
    <div className="flex flex-col gap-6 max-w-lg w-full mx-auto animate-fade-up">
      <div className="flex items-center gap-4">
        <GoBackButton href={`/domain/${domainName}`} />
        <h1 className="text-3xl font-extrabold tracking-tight">Renew domain</h1>
      </div>
      <DomainPayment domain={domainName} mode="renew" />
    </div>
  );
}
