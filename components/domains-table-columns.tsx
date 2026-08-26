"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import type { Domain } from "@/lib/types";
import type { ColumnDef } from "@tanstack/react-table";
import { compareByKey } from "@/lib/sort";

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
  ];
}
