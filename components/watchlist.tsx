"use client";

import Link from "next/link";
import { Star, X } from "lucide-react";

import { JdenticonAvatar } from "@/components/domain-avatar";
import {
  useWatchedNames,
  useWatchlistStore,
} from "@/lib/stores/watchlist-store";

/**
 * The watchlist, rendered where the user goes to check on their names.
 *
 * It does not need a wallet: the list is local, so it is the one thing the
 * profile page can still show before anything is connected.
 *
 * Like WatchButton, it reads the list through `useWatchedNames`, which hides
 * it for the hydration render — the server cannot read localStorage and a
 * mismatch would throw the tree away.
 */
export function Watchlist() {
  const names = useWatchedNames();
  const remove = useWatchlistStore((s) => s.remove);

  if (names.length === 0) {
    return (
      <p
        className="text-sm text-muted-foreground"
        data-testid="watchlist-empty"
      >
        No names watched yet. Open any domain and press the star to keep track
        of it here.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2" data-testid="watchlist">
      {names.map((name) => (
        <li
          key={name}
          className="glass-panel flex items-center gap-3 rounded-xl px-3 py-2"
        >
          <JdenticonAvatar value={name} size={28} />
          <Link
            href={`/domain/${name}`}
            className="focus-ring min-w-0 flex-1 truncate rounded-md font-medium hover:text-primary-glow transition-colors"
          >
            {name}
          </Link>
          <button
            type="button"
            onClick={() => remove(name)}
            aria-label={`Stop watching ${name}`}
            className="focus-ring rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Section heading plus the list, so both profile states render it the same. */
export function WatchlistSection() {
  const names = useWatchedNames();

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Star className="h-4 w-4 text-primary-glow" aria-hidden="true" />
          Watching
        </h2>
        {names.length > 0 && (
          <span className="text-xs font-mono text-muted-foreground tabular-nums">
            {names.length}
          </span>
        )}
      </div>
      <Watchlist />
    </section>
  );
}
