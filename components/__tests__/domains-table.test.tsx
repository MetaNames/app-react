import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DomainsTable } from "../domains-table";
import { compareExpiry } from "../domains-table-columns";
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

function inDays(days: number): Date {
  return new Date(NOW.getTime() + days * 86_400_000);
}

function domain(overrides: Partial<Domain> = {}): Domain {
  return {
    name: "alice.mpc",
    nameWithoutTLD: "alice",
    owner: "0xowner",
    tokenId: 1,
    createdAt: NOW,
    expiresAt: inDays(400),
    parentId: null,
    records: {},
    ...overrides,
  };
}

describe("DomainsTable expiry column", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the expiry date for every dated domain", () => {
    render(<DomainsTable domains={[domain()]} />);
    expect(screen.getByText("Jul 6, 2027")).toBeInTheDocument();
  });

  it("renders Never, and no renew link, for a domain that cannot expire", () => {
    render(<DomainsTable domains={[domain({ expiresAt: null })]} />);
    expect(screen.getByText("Never")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Renew" }),
    ).not.toBeInTheDocument();
  });

  // The relative form is the nudge to act; on a domain with years left it is
  // noise beside the date it already shows.
  it("omits the relative phrase and the renew link when expiry is far off", () => {
    render(<DomainsTable domains={[domain()]} />);
    expect(screen.queryByText(/^in \d+ days?$/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Renew" }),
    ).not.toBeInTheDocument();
  });

  it("warns and offers a renew link inside the warning window", () => {
    render(<DomainsTable domains={[domain({ expiresAt: inDays(9) })]} />);
    expect(screen.getByText("in 9 days")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Renew" })).toHaveAttribute(
      "href",
      "/domain/alice.mpc/renew",
    );
  });

  it("warns and offers a renew link for an already expired domain", () => {
    render(<DomainsTable domains={[domain({ expiresAt: inDays(-3) })]} />);
    expect(screen.getByText("Expired")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Renew" })).toBeInTheDocument();
  });

  // Regression guard: the empty row's colSpan was hardcoded to 3 and silently
  // stopped spanning the table when the expiry column was added.
  it("spans the whole table with the empty-state row", () => {
    render(<DomainsTable domains={[]} />);
    const headerCount = screen.getAllByRole("columnheader").length;
    const emptyRow = screen.getByText("No domains found").closest("td");
    expect(emptyRow).toHaveAttribute("colspan", String(headerCount));
  });

  it("sorts undated domains after dated ones when comparing by expiry", () => {
    const never = domain({ name: "never.mpc", expiresAt: null });
    const soon = domain({ name: "soon.mpc", expiresAt: inDays(5) });
    const later = domain({ name: "later.mpc", expiresAt: inDays(500) });

    expect([never, later, soon].sort(compareExpiry).map((d) => d.name)).toEqual(
      ["soon.mpc", "later.mpc", "never.mpc"],
    );
  });

  it("treats two undated domains as equal rather than reordering them", () => {
    const a = domain({ name: "a.mpc", expiresAt: null });
    const b = domain({ name: "b.mpc", expiresAt: null });
    expect(compareExpiry(a, b)).toBe(0);
  });
});
