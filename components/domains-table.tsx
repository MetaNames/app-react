"use client";
import { useState, useMemo, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { domainsTableColumns } from "@/components/domains-table-columns";
import { DomainsTableSearch } from "@/components/domains-table-search";
import { DomainsTablePagination } from "@/components/domains-table-pagination";
import type { Domain } from "@/lib/types";
import { filterDomainsByName } from "@/lib/filter";

interface DomainsTableProps {
  domains: Domain[];
}

// Legacy (DomainsTable.svelte) defaults to sorting by tokenId ascending and
// showing 5 rows per page — match both so the ported behaviour lines up.
const DEFAULT_SORTING: SortingState = [{ id: "tokenId", desc: false }];
const DEFAULT_PAGE_SIZE = 5;

export function DomainsTable({ domains }: DomainsTableProps) {
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORTING);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const filtered = useMemo(
    () => filterDomainsByName(domains, search),
    [domains, search],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filtered,
    columns: domainsTableColumns(),
    state: { sorting },
    onSortingChange: setSorting,
    // Legacy's table never returns to a true "unsorted" state once loaded —
    // toggling only flips between ascending/descending (sort.test.ts treats
    // "none"/"other" as descending). Disabling sort removal reproduces that.
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Sync pageSize changes to table
  useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);

  const { pageIndex } = table.getState().pagination;
  const total = filtered.length;

  return (
    <div className="flex flex-col gap-4">
      <DomainsTableSearch value={search} onChange={setSearch} />
      <div className="overflow-x-auto rounded-2xl border border-border/60 glass-panel">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-8 text-muted-foreground"
                >
                  No domains found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DomainsTablePagination
        table={table}
        pageIndex={pageIndex}
        pageSize={pageSize}
        total={total}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
