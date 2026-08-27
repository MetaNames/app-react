import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Table } from "@tanstack/react-table";

import { DomainsTablePagination } from "../domains-table-pagination";
import type { Domain } from "@/lib/types";

/** Only the handful of table methods this component actually calls. */
function tableStub(
  overrides: Partial<{
    canPrevious: boolean;
    canNext: boolean;
    pageCount: number;
  }> = {},
) {
  const { canPrevious = true, canNext = true, pageCount = 5 } = overrides;
  const calls = {
    setPageIndex: vi.fn(),
    previousPage: vi.fn(),
    nextPage: vi.fn(),
  };
  const table = {
    ...calls,
    getCanPreviousPage: () => canPrevious,
    getCanNextPage: () => canNext,
    getPageCount: () => pageCount,
  } as unknown as Table<Domain>;
  return { table, calls };
}

function renderPagination(
  props: Partial<{
    pageIndex: number;
    pageSize: number;
    total: number;
    onPageSizeChange: (size: number) => void;
  }> = {},
  tableOverrides = {},
) {
  const { table, calls } = tableStub(tableOverrides);
  const onPageSizeChange = props.onPageSizeChange ?? vi.fn();
  render(
    <DomainsTablePagination
      table={table}
      pageIndex={props.pageIndex ?? 0}
      pageSize={props.pageSize ?? 10}
      total={props.total ?? 42}
      onPageSizeChange={onPageSizeChange}
    />,
  );
  return { calls, onPageSizeChange };
}

describe("DomainsTablePagination", () => {
  it("reports the current window of rows", () => {
    renderPagination({ pageIndex: 2, pageSize: 10, total: 42 });
    expect(screen.getByTestId("pagination-info")).toHaveTextContent(
      "21-30 of 42",
    );
  });

  it("clamps the last window to the number of rows that exist", () => {
    renderPagination({ pageIndex: 4, pageSize: 10, total: 42 });
    expect(screen.getByTestId("pagination-info")).toHaveTextContent(
      "41-42 of 42",
    );
  });

  it("says '0 results' rather than '1-0 of 0' on an empty table", () => {
    renderPagination({ pageIndex: 0, pageSize: 10, total: 0 });
    expect(screen.getByTestId("pagination-info")).toHaveTextContent(
      "0 results",
    );
  });

  it("announces the window politely, so a page change is heard", () => {
    renderPagination();
    expect(screen.getByTestId("pagination-info")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("jumps to the first and last pages", () => {
    const { calls } = renderPagination({}, { pageCount: 5 });

    fireEvent.click(screen.getByTestId("pagination-first"));
    expect(calls.setPageIndex).toHaveBeenCalledWith(0);

    fireEvent.click(screen.getByTestId("pagination-last"));
    expect(calls.setPageIndex).toHaveBeenLastCalledWith(4);
  });

  it("steps one page at a time", () => {
    const { calls } = renderPagination();

    fireEvent.click(screen.getByTestId("pagination-previous"));
    fireEvent.click(screen.getByTestId("pagination-next"));

    expect(calls.previousPage).toHaveBeenCalled();
    expect(calls.nextPage).toHaveBeenCalled();
  });

  it("disables the backward controls on the first page", () => {
    renderPagination({}, { canPrevious: false });
    expect(screen.getByTestId("pagination-first")).toBeDisabled();
    expect(screen.getByTestId("pagination-previous")).toBeDisabled();
  });

  it("disables the forward controls on the last page", () => {
    renderPagination({}, { canNext: false });
    expect(screen.getByTestId("pagination-next")).toBeDisabled();
    expect(screen.getByTestId("pagination-last")).toBeDisabled();
  });
});
