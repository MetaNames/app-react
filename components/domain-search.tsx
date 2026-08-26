"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const abortControllerRef = useRef<AbortController | null>(null);
  const router = useRouter();

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

  const triggerSearch = useCallback(() => {
    if (!query) return;
    const validation = validateDomainName(query);
    if (!validation.valid) {
      setError(validation.error ?? "Invalid domain");
      setResult(null);
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    searchDomain(query, abortControllerRef.current.signal);
  }, [query, searchDomain]);

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
    abortControllerRef.current = controller;
    const timer = setTimeout(() => searchDomain(query, controller.signal), 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, searchDomain]);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-3">
      <div className="glass-panel rounded-2xl p-1.5 flex items-center gap-2 shadow-[0_0_50px_var(--glow)] border-primary/30 focus-within:border-primary/60 transition-colors">
        <Search className="ml-3 h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          className={`pl-2 text-lg h-12 border-0 bg-transparent ${error ? "text-destructive" : ""}`}
          placeholder="Search for a .mpc domain..."
          value={query}
          onChange={(e) => setQuery(e.target.value.toLowerCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (result && !loading) {
                const href = result.available
                  ? `/register/${result.name.replace(/\.mpc$/, "")}`
                  : `/domain/${result.name}`;
                router.push(href);
              } else {
                triggerSearch();
              }
            }
          }}
        />
        <button
          type="button"
          onClick={triggerSearch}
          className="focus-ring bg-primary text-primary-foreground rounded-xl px-5 h-10 text-sm font-bold hover:bg-primary/90 transition-colors shrink-0"
        >
          Search
        </button>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div role="status" aria-live="polite">
        {loading || result ? (
          <Link
            href={
              result?.available
                ? `/register/${result.name.replace(/\.mpc$/, "")}`
                : `/domain/${result?.name}`
            }
            className="block"
          >
            <Card className="glass-panel border-primary/20 hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4">
                {loading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Checking
                    availability...
                  </div>
                ) : result ? (
                  <div className="flex items-center justify-between">
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
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
