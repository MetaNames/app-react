"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import type { Domain } from "@/lib/types";
import type { ColumnDef } from "@tanstack/react-table";
import { compareByKey } from "@/lib/sort";
import {
  expiryStatus,
  formatRelativeExpiry,
  needsAttention,
} from "@/lib/expiry";
import { formatDate } from "@/lib/utils";

/**
 * A domain with no expiry date (a TLD, or anything the chain reports as
 * perpetual) sorts after every dated domain in ascending order, so the rows
 * that actually need attention stay at the top rather than being pushed down
 * by rows that can never expire.
 */
export function compareExpiry(a: Domain, b: Domain): number {
  const [aTime, bTime] = [a.expiresAt, b.expiresAt].map((d) =>
    d ? new Date(d).getTime() : Number.POSITIVE_INFINITY,
  );
  if (aTime === bTime) return 0;
  return aTime < bTime ? -1 : 1;
}

export function domainsTableColumns(): ColumnDef<Domain>[] {
  return [
    {
      accessorKey: "tokenId",
      // Ported from legacy's compareByKey (lib/sort.ts): numeric compare.
      // TanStack negates this for descending, so we only need "ascending".
      sortingFn: (rowA, rowB) =>
        compareByKey<Domain>("tokenId", "ascending")(
          rowA.original,
          rowB.original,
        ),
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting()}
          className="gap-1"
        >
          Token ID <ArrowUpDown className="h-3 w-3" />
        </Button>
      ),
      cell: (i) => i.getValue(),
    },
    {
      accessorKey: "name",
      // Ported from legacy's compareByKey (lib/sort.ts): locale compare.
      sortingFn: (rowA, rowB) =>
        compareByKey<Domain>("name", "ascending")(rowA.original, rowB.original),
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting()}
          className="gap-1"
        >
          Domain Name <ArrowUpDown className="h-3 w-3" />
        </Button>
      ),
      cell: (i) => (
        <Link
          href={`/domain/${i.getValue() as string}`}
          className="hover:underline font-medium"
        >
          {i.getValue() as string}
        </Link>
      ),
    },
    {
      accessorKey: "parentId",
      header: "Parent",
      cell: (i) =>
        i.getValue() ? (
          <Link
            href={`/domain/${i.getValue() as string}`}
            className="hover:underline text-sm text-muted-foreground"
          >
            {i.getValue() as string}
          </Link>
        ) : (
          "—"
        ),
    },
    {
      // The portfolio is where an owner would notice a name is about to lapse,
      // but until now expiry was only visible one domain at a time. Sorting
      // ascending puts whatever expires first at the top.
      accessorKey: "expiresAt",
      sortingFn: (rowA, rowB) => compareExpiry(rowA.original, rowB.original),
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting()}
          className="gap-1"
        >
          Expires <ArrowUpDown className="h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const domain = row.original;
        const status = expiryStatus(domain.expiresAt);
        if (status.state === "never")
          return <span className="text-sm text-muted-foreground">Never</span>;
        return (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-sm tabular-nums">
              {formatDate(domain.expiresAt)}
            </span>
            {/* The relative form only earns its space when it is actionable —
                a name with years left does not need "in 900 days" beside its
                date, but one with days left does. */}
            {needsAttention(status) && (
              <span className="text-xs font-medium text-destructive">
                {formatRelativeExpiry(status)}
              </span>
            )}
            {needsAttention(status) && (
              <Link
                href={`/domain/${domain.name}/renew`}
                className="focus-ring rounded-md text-xs font-semibold text-primary hover:underline"
              >
                Renew
              </Link>
            )}
          </div>
        );
      },
    },
  ];
}
