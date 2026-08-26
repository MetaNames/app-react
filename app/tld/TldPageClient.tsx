"use client";
import { Domain } from "@/components/domain";
import type { Domain as DomainType } from "@/lib/types";

interface TldPageClientProps {
  initialDomain: DomainType;
}

export function TldPageClient({ initialDomain }: TldPageClientProps) {
  return (
    <div className="spotlight-beam flex flex-col gap-6 relative z-10 animate-fade-up">
      <h1 className="text-3xl font-extrabold tracking-tight">
        TLD Information
      </h1>
      <p className="text-muted-foreground">The root of the .mpc namespace</p>
      <Domain domain={initialDomain} isTld={true} />
    </div>
  );
}
