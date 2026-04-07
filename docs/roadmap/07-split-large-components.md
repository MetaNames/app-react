# Implementation Plan: Splitting Oversized Components

## Overview

Five components exceed the 150-line threshold and require refactoring. This document details the extraction strategy for each, with a step-by-step walkthrough for `domains-table.tsx` as the primary example.

---

## 1. Component Analysis

### `components/domains-table.tsx` (242 lines)

**Logical sections:**

| Section             | Lines   | Responsibility                              |
| ------------------- | ------- | ------------------------------------------- |
| Column definitions  | 59–108  | Column configuration with headers and cells |
| Search/filter UI    | 128–144 | Search input with clear button              |
| Table rendering     | 145–184 | Table header, body, and empty state         |
| Pagination controls | 185–239 | Page size selector, navigation buttons      |

**State:** `sorting`, `search`, `pageSize` (local to component)

---

### `components/domain.tsx` (196 lines)

**Logical sections:**

| Section           | Lines   | Responsibility                            |
| ----------------- | ------- | ----------------------------------------- |
| `JdenticonAvatar` | 25–39   | Avatar rendering with jdenticon           |
| `DetailsContent`  | 41–113  | Profile, Whois, and Social record display |
| Main `Domain`     | 116–195 | Tab structure, owner conditional, layout  |

**State:** Uses stores (`useWalletStore`, `useSdkStore`), no local state beyond derived values.

---

### `components/ui/select.tsx` (202 lines)

**Logical sections:**

| Section                  | Lines   | Responsibility         |
| ------------------------ | ------- | ---------------------- |
| `SelectGroup`            | 11–19   | Group wrapper          |
| `SelectValue`            | 21–29   | Value display          |
| `SelectTrigger`          | 31–57   | Trigger button         |
| `SelectContent`          | 59–99   | Popup with positioning |
| `SelectLabel`            | 101–112 | Group label            |
| `SelectItem`             | 114–140 | Individual option      |
| `SelectSeparator`        | 142–153 | Divider                |
| `SelectScrollUpButton`   | 155–171 | Scroll navigation      |
| `SelectScrollDownButton` | 173–189 | Scroll navigation      |

**Assessment:** Each sub-component is already a separate function. No extraction needed—consider adding a barrel file or leaving as-is. **Excluded from extraction scope.**

---

### `components/records.tsx` (154 lines)

**Logical sections:**

| Section               | Lines  | Responsibility                                          |
| --------------------- | ------ | ------------------------------------------------------- |
| Add record form       | 95–151 | Card with Select, Textarea, and submit button           |
| Record list rendering | 82–93  | Iterates over `usedTypes` to render `Record` components |
| `handleAdd` logic     | 39–75  | Async transaction submission                            |

**State:** `newType`, `newValue`, `addError`, `adding`

---

### `components/record.tsx` (152 lines)

**Logical sections:**

| Section                    | Lines   | Responsibility                                 |
| -------------------------- | ------- | ---------------------------------------------- |
| Display/edit mode          | 40–80   | Conditional rendering based on `editing` state |
| Action buttons             | 82–124  | Edit, save, cancel, delete buttons             |
| Delete confirmation dialog | 126–149 | Dialog for delete confirmation                 |

**State:** All managed via `useRecordManagement` hook.

**Assessment:** Already well-structured with hook delegation. **Excluded from extraction scope.**

---

## 2. Extraction Strategy

### `domains-table.tsx`

| Sub-component      | File                                      | Export name              |
| ------------------ | ----------------------------------------- | ------------------------ |
| Column definitions | `components/domains-table-columns.tsx`    | `domainsTableColumns`    |
| Search input       | `components/domains-table-search.tsx`     | `DomainsTableSearch`     |
| Pagination         | `components/domains-table-pagination.tsx` | `DomainsTablePagination` |
| Main (reassembled) | `components/domains-table.tsx`            | `DomainsTable`           |

### `domain.tsx`

| Sub-component      | File                            | Export name              |
| ------------------ | ------------------------------- | ------------------------ |
| Avatar             | `components/domain-avatar.tsx`  | `JdenticonAvatar` (keep) |
| Details            | `components/domain-details.tsx` | `DetailsContent` (keep)  |
| Main (reassembled) | `components/domain.tsx`         | `Domain`                 |

### `records.tsx`

| Sub-component      | File                              | Export name      |
| ------------------ | --------------------------------- | ---------------- |
| Add record form    | `components/records-add-form.tsx` | `RecordsAddForm` |
| Main (reassembled) | `components/records.tsx`          | `Records`        |

---

## 3. Step-by-Step: `domains-table.tsx`

### Step 1: Create column definitions file

**File:** `components/domains-table-columns.tsx`

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import type { Domain } from "@/lib/types";
import type { ColumnDef } from "@tanstack/react-table";

export function domainsTableColumns(): ColumnDef<Domain>[] {
  return [
    {
      accessorKey: "tokenId",
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
```

### Step 2: Create search component file

**File:** `components/domains-table-search.tsx`

```tsx
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface DomainsTableSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function DomainsTableSearch({
  value,
  onChange,
}: DomainsTableSearchProps) {
  return (
    <div className="relative max-w-xs">
      <Input
        data-testid="search-bar"
        placeholder="Search domains..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-8"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
```

### Step 3: Create pagination component file

**File:** `components/domains-table-pagination.tsx`

```tsx
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { table } from "@tanstack/react-table";

interface DomainsTablePaginationProps {
  table: ReturnType<typeof table>;
  pageIndex: number;
  pageSize: number;
  total: number;
  onPageSizeChange: (size: number) => void;
}

export function DomainsTablePagination({
  table,
  pageIndex,
  pageSize,
  total,
  onPageSizeChange,
}: DomainsTablePaginationProps) {
  const from = pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">
        {total > 0 ? `${from}-${to} of ${total}` : "0 results"}
      </span>
      <div className="flex items-center gap-2">
        <Select
          value={String(pageSize)}
          onValueChange={(v) =>
            onPageSizeChange(v === "max" ? 9999 : Number(v))
          }
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 20].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
            <SelectItem value="max">Max</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronFirst className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          <ChevronLast className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

### Step 4: Refactor main component

**File:** `components/domains-table.tsx` (refactored)

```tsx
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
```

---

## 4. Maintaining Props Interface

### Principles

1. **Props stay in main component** — The parent-facing interface remains unchanged. Sub-components receive only the data they render.
2. **No prop drilling** — Pass individual values, not the entire props object.
3. **Callback patterns** — Use `onChange` or event callbacks for state that originates in parent.

### Example: `DomainsTableProps`

| Property  | Usage           | Passed to sub-component                         |
| --------- | --------------- | ----------------------------------------------- |
| `domains` | Filtering logic | No (computed `filtered` passed to table)        |
| N/A       | `search`        | `DomainsTableSearch` via `value` + `onChange`   |
| N/A       | `pageSize`      | `DomainsTablePagination` via `onPageSizeChange` |

### Interface compatibility

When refactoring, the component signature must remain identical:

```tsx
// Before and after — same interface
export function DomainsTable({ domains }: DomainsTableProps);
```

---

## 5. Files to Modify

### Create

- `components/domains-table-columns.tsx`
- `components/domains-table-search.tsx`
- `components/domains-table-pagination.tsx`
- `components/domain-avatar.tsx`
- `components/domain-details.tsx`
- `components/records-add-form.tsx`

### Modify

- `components/domains-table.tsx`
- `components/domain.tsx`
- `components/records.tsx`

---

## 6. Execution Order

1. **`domains-table.tsx`** — Example implementation above. Validate TanStack Table column function pattern.
2. **`domain.tsx`** — Extract `JdenticonAvatar` and `DetailsContent`. Main component remains thin.
3. **`records.tsx`** — Extract add record form. Main component becomes record list renderer.
4. **Update imports** — Verify no circular imports with store/type dependencies.

---

## 7. Excluded Components

- **`components/ui/select.tsx`** — Already composed of small, single-responsibility functions. No extraction needed.
- **`components/record.tsx`** — Logic already delegated to `useRecordManagement` hook. Extraction would add indirection without benefit.
