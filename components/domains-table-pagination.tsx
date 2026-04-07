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
import type { Table } from "@tanstack/react-table";
import type { Domain } from "@/lib/types";

interface DomainsTablePaginationProps {
  table: Table<Domain>;
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
