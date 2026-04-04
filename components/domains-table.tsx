'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel, flexRender, type ColumnDef, type SortingState } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, X, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Domain } from '@/lib/types';

interface DomainsTableProps { domains: Domain[]; }

export function DomainsTable({ domains }: DomainsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    if (!search) return domains;
    const q = search.toLowerCase();
    return domains.filter((d) => d.name.toLowerCase().startsWith(q) || d.name.toLowerCase().includes(q));
  }, [domains, search]);

  const columns: ColumnDef<Domain>[] = [
    { accessorKey: 'tokenId', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting()} className="gap-1">Token ID <ArrowUpDown className="h-3 w-3" /></Button>, cell: (i) => i.getValue() },
    { accessorKey: 'name', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting()} className="gap-1">Domain Name <ArrowUpDown className="h-3 w-3" /></Button>, cell: (i) => <Link href={`/domain/${i.getValue() as string}`} className="hover:underline font-medium">{i.getValue() as string}</Link> },
    { accessorKey: 'parentId', header: 'Parent', cell: (i) => i.getValue() ? <Link href={`/domain/${i.getValue() as string}`} className="hover:underline text-sm text-muted-foreground">{i.getValue() as string}</Link> : '—' },
  ];

  const table = useReactTable({ data: filtered, columns, state: { sorting, pagination: { pageIndex: 0, pageSize } }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getPaginationRowModel: getPaginationRowModel(), getFilteredRowModel: getFilteredRowModel() });
  const { pageIndex } = table.getState().pagination;
  const total = filtered.length;
  const from = pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-xs">
        <Input data-testid="search-bar" placeholder="Search domains..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-8" />
        {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="h-4 w-4 text-muted-foreground" /></button>}
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>{table.getHeaderGroups().map((hg) => <TableRow key={hg.id}>{hg.headers.map((h) => <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
          <TableBody>{table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No domains found</TableCell></TableRow>}</TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{total > 0 ? `${from}-${to} of ${total}` : '0 results'}</span>
        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(v === 'max' ? 9999 : Number(v))}>
            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
            <SelectContent>{[5, 10, 20].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}<SelectItem value="max">Max</SelectItem></SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}><ChevronFirst className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}><ChevronLast className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}