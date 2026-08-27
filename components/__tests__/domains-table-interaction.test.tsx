import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { DomainsTable } from "../domains-table";
import type { Domain } from "@/lib/types";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const NOW = new Date("2026-06-01T12:00:00.000Z");

function domain(name: string, tokenId: number): Domain {
  return {
    name,
    nameWithoutTLD: name.replace(/\.mpc$/, ""),
    owner: "0xowner",
    tokenId,
    createdAt: NOW,
    expiresAt: new Date(NOW.getTime() + tokenId * 86_400_000),
    parentId: null,
    records: {},
  };
}

// Twelve rows over a default page size of five: enough for three pages, so
// paging forward, back and to the edges are all distinguishable.
const DOMAINS = [
  ...Array.from({ length: 9 }, (_, i) => domain(`alpha${i}.mpc`, i + 1)),
  domain("beta.mpc", 10),
  domain("gamma.mpc", 11),
  domain("delta.mpc", 12),
];

function rowNames(): string[] {
  const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
  return rows.map((row) => row.querySelectorAll("td")[1]?.textContent ?? "");
}

describe("DomainsTable filtering", () => {
  it("narrows the rows to names containing the query", () => {
    render(<DomainsTable domains={DOMAINS} />);

    fireEvent.change(screen.getByTestId("search-bar"), {
      target: { value: "beta" },
    });

    expect(rowNames()).toEqual(["beta.mpc"]);
    expect(screen.getByTestId("pagination-info")).toHaveTextContent("1-1 of 1");
  });

  it("matches case-insensitively", () => {
    render(<DomainsTable domains={DOMAINS} />);

    fireEvent.change(screen.getByTestId("search-bar"), {
      target: { value: "GAMMA" },
    });

    expect(rowNames()).toEqual(["gamma.mpc"]);
  });

  it("restores every row when the filter is cleared with the clear button", () => {
    render(<DomainsTable domains={DOMAINS} />);

    fireEvent.change(screen.getByTestId("search-bar"), {
      target: { value: "beta" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Clear domain filter" }),
    );

    expect(screen.getByTestId("search-bar")).toHaveValue("");
    expect(screen.getByTestId("pagination-info")).toHaveTextContent(
      `1-5 of ${DOMAINS.length}`,
    );
  });

  it("says so plainly when nothing matches", () => {
    render(<DomainsTable domains={DOMAINS} />);

    fireEvent.change(screen.getByTestId("search-bar"), {
      target: { value: "nothinglikethis" },
    });

    expect(screen.getByText("No domains found")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-info")).toHaveTextContent(
      "0 results",
    );
  });

  // Filtering while on a later page used to leave the table parked on a page
  // index the shorter result set no longer has, showing an empty table for a
  // query that plainly matches something.
  it("returns to the first page when the filter shrinks the result set", () => {
    render(<DomainsTable domains={DOMAINS} />);

    fireEvent.click(screen.getByRole("button", { name: "Last page" }));
    fireEvent.change(screen.getByTestId("search-bar"), {
      target: { value: "beta" },
    });

    expect(rowNames()).toEqual(["beta.mpc"]);
  });
});

describe("DomainsTable pagination", () => {
  it("pages forward and back through the rows", () => {
    render(<DomainsTable domains={DOMAINS} />);

    const firstPage = rowNames();
    expect(screen.getByTestId("pagination-info")).toHaveTextContent(
      "1-5 of 12",
    );

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(rowNames()).not.toEqual(firstPage);
    expect(screen.getByTestId("pagination-info")).toHaveTextContent(
      "6-10 of 12",
    );

    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(rowNames()).toEqual(firstPage);
  });

  it("disables the backward controls on the first page and the forward ones on the last", () => {
    render(<DomainsTable domains={DOMAINS} />);

    expect(screen.getByRole("button", { name: "First page" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Previous page" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Last page" }));

    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Last page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "First page" })).toBeEnabled();
    expect(screen.getByTestId("pagination-info")).toHaveTextContent(
      "11-12 of 12",
    );
  });

  it("reports no results rather than a range when the table is empty", () => {
    render(<DomainsTable domains={[]} />);
    expect(screen.getByTestId("pagination-info")).toHaveTextContent(
      "0 results",
    );
  });
});

describe("DomainsTable sorting", () => {
  it("toggles a column between ascending and descending order", () => {
    render(<DomainsTable domains={DOMAINS} />);

    const nameHeader = screen.getByRole("button", { name: /Domain Name|Name/ });
    fireEvent.click(nameHeader);
    const ascending = rowNames();
    expect([...ascending].sort()).toEqual(ascending);

    fireEvent.click(nameHeader);
    expect(rowNames()).not.toEqual(ascending);
  });
});
