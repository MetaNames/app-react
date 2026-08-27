"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, X } from "lucide-react";

import { JdenticonAvatar } from "@/components/domain-avatar";
import {
  expiryStatus,
  formatRelativeExpiry,
  needsAttention,
} from "@/lib/expiry";
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
/** What a watched name turned out to be, once the chain answered. */
type WatchedStatus =
  | { kind: "available" }
  | { kind: "registered"; expiresAt: string | null };

/**
 * The point of watching a name is knowing when it frees up, so the list looks
 * each one up rather than showing a row of bare strings.
 *
 * The lookups are capped: the watchlist holds up to a hundred names and each
 * one is a chain read, so a long list would fire a hundred requests on every
 * visit to the profile. The names past the cap still render, just without a
 * status — a missing badge is a far smaller loss than a stalled page.
 */
const STATUS_LOOKUP_LIMIT = 25;

function useWatchedStatuses(
  names: readonly string[],
): Record<string, WatchedStatus> {
  const [statuses, setStatuses] = useState<Record<string, WatchedStatus>>({});
  // The array identity changes on every store write; the joined key does not,
  // so a re-render without a membership change does not re-run the lookups.
  const key = names.join(",");

  useEffect(() => {
    const wanted = key ? key.split(",").slice(0, STATUS_LOOKUP_LIMIT) : [];
    if (wanted.length === 0) return;

    const controller = new AbortController();

    (async () => {
      const entries = await Promise.all(
        wanted.map(async (name): Promise<[string, WatchedStatus] | null> => {
          try {
            const response = await fetch(
              `/api/domains/${encodeURIComponent(name)}`,
              { signal: controller.signal },
            );
            if (!response.ok) return null;
            const { domain } = await response.json();
            return [
              name,
              domain
                ? { kind: "registered", expiresAt: domain.expiresAt ?? null }
                : { kind: "available" },
            ];
          } catch {
            // One name that fails to resolve costs its own badge, not the list.
            return null;
          }
        }),
      );

      if (controller.signal.aborted) return;
      setStatuses(Object.fromEntries(entries.filter((e) => e !== null)));
    })();

    return () => controller.abort();
  }, [key]);

  return statuses;
}

/** The badge for one watched name, or nothing while its lookup is in flight. */
function WatchedBadge({ status }: { status: WatchedStatus | undefined }) {
  if (!status) return null;

  if (status.kind === "available") {
    return (
      <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-[var(--chip-available-bg)] text-[var(--chip-available-fg)]">
        Available
      </span>
    );
  }

  const expiry = expiryStatus(status.expiresAt);
  // A date months out is noise on a list; the point of the badge is to catch
  // the moment a name is about to become gettable.
  if (!needsAttention(expiry)) return null;

  return (
    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-[var(--chip-registered-bg)] text-[var(--chip-registered-fg)]">
      {expiry.state === "expired"
        ? "Expired"
        : `Expires ${formatRelativeExpiry(expiry)}`}
    </span>
  );
}

export function Watchlist() {
  const names = useWatchedNames();
  const remove = useWatchlistStore((s) => s.remove);
  const statuses = useWatchedStatuses(names);

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
            href={
              statuses[name]?.kind === "available"
                ? `/register/${name}`
                : `/domain/${name}`
            }
            className="focus-ring min-w-0 flex-1 truncate rounded-md font-medium hover:text-primary-glow transition-colors"
          >
            {name}
          </Link>
          <WatchedBadge status={statuses[name]} />
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
