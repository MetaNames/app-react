"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
import { validateDomainName, normalizeDomain } from "@/lib/domain-validator";
import { useSdkStore } from "@/lib/stores/sdk-store";

const EXAMPLE_NAMES = ["alice", "satoshi", "partisia"];

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
  const inputRef = useRef<HTMLInputElement>(null);
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

  const clearQuery = useCallback(() => {
    setQuery("");
    inputRef.current?.focus();
  }, []);

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

  const resultHref = result?.available
    ? `/register/${result.name.replace(/\.mpc$/, "")}`
    : `/domain/${result?.name}`;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-3">
      <div
        className={`glass-panel rounded-2xl p-1.5 flex items-center gap-2 shadow-[0_0_50px_var(--glow)] transition-colors ${
          error
            ? "border-destructive/60"
            : "border-primary/30 focus-within:border-primary/60"
        }`}
      >
        <Search
          className="ml-3 h-4 w-4 text-muted-foreground shrink-0"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          aria-label="Search for a domain"
          aria-invalid={error ? true : undefined}
          className={`pl-2 text-lg h-12 border-0 bg-transparent ${error ? "text-destructive" : ""}`}
          placeholder="Search for a .mpc domain..."
          value={query}
          onChange={(e) => setQuery(e.target.value.toLowerCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (result && !loading) {
                router.push(resultHref);
              } else {
                triggerSearch();
              }
            }
          }}
        />
        {query && (
          <button
            type="button"
            onClick={clearQuery}
            aria-label="Clear search"
            className="focus-ring rounded-full p-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {/*
          No spinner here on purpose: the result card below already owns the
          single "checking availability" spinner, and a second one would both
          duplicate the signal and make `.animate-spin` ambiguous to assert on.
          The button reports the same state by going disabled.
        */}
        <button
          type="button"
          onClick={triggerSearch}
          disabled={!query || loading}
          aria-busy={loading}
          className="focus-ring bg-primary text-primary-foreground rounded-xl px-5 h-10 text-sm font-bold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
        >
          Search
        </button>
      </div>
      {error && (
        <p className="text-destructive text-sm px-1" role="alert">
          {error}
        </p>
      )}
      <div role="status" aria-live="polite">
        {loading || result ? (
          <Link href={resultHref} className="focus-ring block rounded-xl">
            <Card className="glass-panel border-primary/20 hover:border-primary/50 hover:bg-[hsl(0_0%_100%/0.07)] transition-colors cursor-pointer">
              <CardContent className="p-4">
                {loading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Checking
                    availability...
                  </div>
                ) : result ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-medium truncate">
                        {result.name}
                      </span>
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        {result.available
                          ? "Register this name"
                          : "View this domain"}
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </span>
                    </div>
                    <Badge
                      className={
                        result.available
                          ? "bg-[var(--chip-available-bg)] text-[var(--chip-available-fg)] shrink-0"
                          : "bg-[var(--chip-registered-bg)] text-[var(--chip-registered-fg)] shrink-0"
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
      {!query && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground px-1">
          <span>Try</span>
          {EXAMPLE_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setQuery(name)}
              className="focus-ring glass-panel rounded-full px-2.5 py-1 hover:text-foreground hover:border-primary/40 transition-colors"
            >
              {name}.mpc
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
