"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface RecentDomain {
  name: string;
  createdAt: string;
}

export function RecentDomainsTicker() {
  const [domains, setDomains] = useState<RecentDomain[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/domains/recent")
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("bad status")),
      )
      .then((data: RecentDomain[]) => {
        if (!cancelled) setDomains(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (domains.length === 0) return null;

  return (
    <div
      className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto animate-fade-up"
      aria-label="Recently registered domains"
    >
      {domains.slice(0, 6).map((d) => (
        <Link
          key={d.name}
          href={`/domain/${d.name}`}
          className="text-xs px-3 py-1.5 rounded-full glass-panel text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
        >
          <span aria-hidden="true" className="text-primary mr-1">
            ✦
          </span>
          {d.name}
        </Link>
      ))}
    </div>
  );
}
