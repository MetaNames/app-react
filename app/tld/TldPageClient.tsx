"use client";
import { Domain } from "@/components/domain";
import type { Domain as DomainType } from "@/lib/types";

interface TldPageClientProps {
  initialDomain: DomainType;
}

export function TldPageClient({ initialDomain }: TldPageClientProps) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">TLD Information</h1>
      <Domain domain={initialDomain} isTld={true} />
    </div>
  );
}
