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
        "focus-ring rounded-md p-1.5 transition-colors",
        isWatched
          ? "text-primary-glow"
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <Star
        className="h-4 w-4"
        aria-hidden="true"
        fill={isWatched ? "currentColor" : "none"}
      />
    </button>
  );
}
