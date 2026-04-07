"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import { validateDomainName, normalizeDomain } from "@/lib/domain-validator";
import { useSdkStore } from "@/lib/stores/sdk-store";

export function DomainSearch() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{
    name: string;
    available: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const metaNamesSdk = useSdkStore((s) => s.metaNamesSdk);

  const searchDomain = useCallback(
    async (searchQuery: string, signal: AbortSignal) => {
      if (!metaNamesSdk) return;
      setLoading(true);
      try {
        const domainName = normalizeDomain(searchQuery);
        const domain = await metaNamesSdk.domainRepository.find(domainName);
        if (signal.aborted) return;
        setResult({ name: domainName, available: domain == null });
      } catch (e) {
        if (signal.aborted) return;
        console.error("Error searching domain:", e);
        setError("Failed to search domain. Please try again.");
        setResult(null);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [metaNamesSdk],
  );

  useEffect(() => {
    if (!query) {
      setResult(null);
      setError(null);
      return;
    }
    const validation = validateDomainName(query);
    if (!validation.valid) {
      setError(validation.error ?? "Invalid domain");
      setResult(null);
      return;
    }
    setError(null);
    const controller = new AbortController();
    const timer = setTimeout(() => searchDomain(query, controller.signal), 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, searchDomain]);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className={`pl-10 text-lg h-12 ${error ? "border-destructive" : ""}`}
          placeholder="Search for a .mpc domain..."
          value={query}
          onChange={(e) => setQuery(e.target.value.toLowerCase())}
        />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {(loading || result) && (
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking
                availability...
              </div>
            ) : result ? (
              <Link
                href={
                  result.available
                    ? `/register/${result.name.replace(/\.mpc$/, "")}`
                    : `/domain/${result.name}`
                }
                className="flex items-center justify-between hover:opacity-80 transition-opacity"
              >
                <span className="font-medium">{result.name}</span>
                <Badge
                  className={
                    result.available
                      ? "bg-[hsl(var(--chip-available-bg))] text-[hsl(var(--chip-available-fg))]"
                      : "bg-[hsl(var(--chip-registered-bg))] text-[hsl(var(--chip-registered-fg))]"
                  }
                >
                  {result.available ? "Available" : "Registered"}
                </Badge>
              </Link>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
