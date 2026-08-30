"use client";

import { Star } from "lucide-react";

import {
  useWatchedNames,
  useWatchlistStore,
} from "@/lib/stores/watchlist-store";
import { cn } from "@/lib/utils";

interface WatchButtonProps {
  name: string;
  className?: string;
}

/**
 * Add or remove a name from the local watchlist.
 *
 * A bare star next to a page title reads as decoration, so the control carries
 * its own word — "Watch" or "Watching" — and the filled star is the state, not
 * the whole affordance.
 *
 * The watched state comes from `useWatchedNames`, which reports "not watched"
 * for the hydration render so the server's markup matches; the star fills in
 * one frame later, on an element the user has not reached yet.
 */
export function WatchButton({ name, className }: WatchButtonProps) {
  const isWatched = useWatchedNames().includes(name);
  const toggle = useWatchlistStore((s) => s.toggle);

  return (
    <button
      type="button"
      onClick={() => toggle(name)}
      aria-pressed={isWatched}
      aria-label={isWatched ? `Stop watching ${name}` : `Watch ${name}`}
      data-testid="watch-button"
      className={cn(
        "focus-ring inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
        isWatched
          ? "border-primary/50 bg-primary/10 text-primary-glow hover:bg-primary/20"
          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
        className,
      )}
    >
      <Star
        className="h-3.5 w-3.5 shrink-0"
        aria-hidden="true"
        fill={isWatched ? "currentColor" : "none"}
      />
      {isWatched ? "Watching" : "Watch"}
    </button>
  );
}
