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
import { suggestNames } from "@/lib/suggestions";
import {
  useRecentSearches,
  useRecentSearchesStore,
} from "@/lib/stores/recent-searches-store";

const EXAMPLE_NAMES = ["alice", "satoshi", "partisia"];

// Each candidate costs one chain lookup, so we probe a small batch and show
// the first few that come back free rather than checking every variation.
const SUGGESTIONS_PROBED = 8;
const SUGGESTIONS_SHOWN = 4;

export function DomainSearch() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{
    name: string;
    available: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const metaNamesSdk = useSdkStore((s) => s.metaNamesSdk);
  const recentSearches = useRecentSearches();
  const recordSearch = useRecentSearchesStore((s) => s.record);
  const clearRecentSearches = useRecentSearchesStore((s) => s.clear);
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
        // Only a lookup that reached the chain is worth remembering: a name
        // typed halfway and abandoned never gets here, and neither does one
        // that failed, so the row stays a list of real searches.
        recordSearch(domainName);
      } catch (e) {
        if (signal.aborted) return;
        console.error("Error searching domain:", e);
        setError("Failed to search domain. Please try again.");
        setResult(null);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [metaNamesSdk, recordSearch],
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

  // The search box is the only thing anyone comes to this page to use, but on
  // a short viewport it can sit below the fold after scrolling. "/" is the
  // conventional focus-search key; Cmd/Ctrl+K is the other one people reach
  // for, and is claimed here so the browser's own find-in-page (Cmd+F) is
  // left alone.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const shortcut =
        event.key === "/" ||
        ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k");
      if (!shortcut) return;

      // Typing "/" into any field — including this one — must insert the
      // character, not steal focus back to the top of the page.
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable === true;
      if (typing && event.key === "/") return;

      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
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

  // A taken name leaves the searcher with nothing to do. Probing a handful of
  // variations turns the dead end into a next step — and only names confirmed
  // free on chain are offered, so every chip leads to a registration that works.
  useEffect(() => {
    setSuggestions([]);
    if (!metaNamesSdk || !result || result.available) return;

    const controller = new AbortController();
    const candidates = suggestNames(result.name, SUGGESTIONS_PROBED);

    (async () => {
      const free = await Promise.all(
        candidates.map(async (candidate) => {
          try {
            const domain = await metaNamesSdk.domainRepository.find(
              normalizeDomain(candidate),
            );
            return domain == null ? candidate : null;
          } catch {
            // One failed lookup should cost that one suggestion, not the row.
            return null;
          }
        }),
      );
      if (controller.signal.aborted) return;
      setSuggestions(
        free
          .filter((name): name is string => name !== null)
          .slice(0, SUGGESTIONS_SHOWN),
      );
    })();

    return () => controller.abort();
  }, [metaNamesSdk, result]);

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
        <kbd
          className="hidden sm:inline-flex items-center rounded-md border border-border/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground shrink-0"
          aria-hidden="true"
        >
          /
        </kbd>
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
      {suggestions.length > 0 && (
        <div
          className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground px-1"
          data-testid="name-suggestions"
        >
          <span>Taken. Try</span>
          {suggestions.map((name) => (
            <Link
              key={name}
              href={`/register/${name}`}
              className="focus-ring glass-panel rounded-full px-2.5 py-1 hover:text-foreground hover:border-primary/40 transition-colors"
            >
              {name}.mpc
            </Link>
          ))}
        </div>
      )}
      {!query && recentSearches.length > 0 && (
        <div
          className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground px-1"
          data-testid="recent-searches"
        >
          <span>Recent</span>
          {recentSearches.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setQuery(name.replace(/\.mpc$/, ""))}
              className="focus-ring glass-panel rounded-full px-2.5 py-1 hover:text-foreground hover:border-primary/40 transition-colors"
            >
              {name}
            </button>
          ))}
          <button
            type="button"
            onClick={clearRecentSearches}
            data-testid="clear-recent-searches"
            className="focus-ring rounded-full px-2 py-1 underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Clear
          </button>
        </div>
      )}
      {!query && recentSearches.length === 0 && (
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
