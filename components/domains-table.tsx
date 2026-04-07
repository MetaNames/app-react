"use client";
import { useState, useMemo } from "react";
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

interface DomainsTableProps {
  domains: Domain[];
}

export function DomainsTable({ domains }: DomainsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    if (!search) return domains;
    const q = search.toLowerCase();
    return domains.filter(
      (d) =>
        d.name.toLowerCase().startsWith(q) || d.name.toLowerCase().includes(q),
    );
  }, [domains, search]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filtered,
    columns: domainsTableColumns(),
    state: { sorting, pagination: { pageIndex: 0, pageSize } },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const { pageIndex } = table.getState().pagination;
  const total = filtered.length;

  return (
    <div className="flex flex-col gap-4">
      <DomainsTableSearch value={search} onChange={setSearch} />
      <div className="overflow-x-auto rounded-md border">
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
