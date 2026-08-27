import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DetailsContent } from "../domain-details";
import type { Domain } from "@/lib/types";

vi.mock("../../lib/config", () => ({
  config: {
    browserUrl: "https://browser.testnet.partisiablockchain.com",
    isTestnet: true,
  },
}));

// Mirrors Domain.svelte:91-105 (app-legacy/src/components/Domain.svelte): Parent
// and Expires chips are only ever shown for non-TLD domains, and a non-TLD domain
// with no expiry shows an Expires chip reading "Never" rather than omitting it.
const baseDomain: Domain = {
  name: "example.mpc",
  nameWithoutTLD: "example",
  owner: "00" + "a".repeat(62),
  tokenId: 1,
  createdAt: new Date(),
  expiresAt: null,
  parentId: null,
  records: {},
};

describe("DetailsContent Whois chips", () => {
  it("shows 'Never' for the Expires chip when a non-TLD domain has no expiry", () => {
    render(
      <DetailsContent
        domain={baseDomain}
        profileRecords={[]}
        socialRecords={[]}
        isTld={false}
      />,
    );
    expect(screen.getByText("Expires")).toBeInTheDocument();
    expect(screen.getByText("Never")).toBeInTheDocument();
  });

  it("shows the formatted date for the Expires chip when expiresAt is set", () => {
    render(
      <DetailsContent
        domain={{ ...baseDomain, expiresAt: new Date("2030-01-01") }}
        profileRecords={[]}
        socialRecords={[]}
        isTld={false}
      />,
    );
    expect(screen.getByText("Expires")).toBeInTheDocument();
    expect(screen.queryByText("Never")).not.toBeInTheDocument();
  });

  it("shows the Parent chip when parentId is set on a non-TLD domain", () => {
    render(
      <DetailsContent
        domain={{ ...baseDomain, parentId: "parent.mpc" }}
        profileRecords={[]}
        socialRecords={[]}
        isTld={false}
      />,
    );
    expect(screen.getByText("Parent")).toBeInTheDocument();
    expect(screen.getByText("parent.mpc")).toBeInTheDocument();
  });

  it("never shows Parent or Expires chips for a TLD domain, even with truthy fields", () => {
    render(
      <DetailsContent
        domain={{
          ...baseDomain,
          parentId: "parent.mpc",
          expiresAt: new Date("2030-01-01"),
        }}
        profileRecords={[]}
        socialRecords={[]}
        isTld={true}
      />,
    );
    expect(screen.queryByText("Parent")).not.toBeInTheDocument();
    expect(screen.queryByText("Expires")).not.toBeInTheDocument();
    expect(screen.queryByText("Never")).not.toBeInTheDocument();
  });

  it("always shows the Owner chip, TLD or not", () => {
    render(
      <DetailsContent
        domain={baseDomain}
        profileRecords={[]}
        socialRecords={[]}
        isTld={true}
      />,
    );
    expect(screen.getByText("Owner")).toBeInTheDocument();
  });
});

describe("DetailsContent profile and social sections", () => {
  const withRecords = {
    ...baseDomain,
    records: {
      Bio: "hello world",
      Uri: "https://example.com",
      Price: "42",
      Twitter: "@example",
    },
  };

  it("omits the Profile and Social sections when there are no such records", () => {
    render(
      <DetailsContent
        domain={baseDomain}
        profileRecords={[]}
        socialRecords={[]}
        isTld={false}
      />,
    );
    expect(screen.queryByText("Profile")).not.toBeInTheDocument();
    expect(screen.queryByText("Social")).not.toBeInTheDocument();
  });

  it("renders a Uri record as a followable link rather than a copy chip", () => {
    render(
      <DetailsContent
        domain={withRecords}
        profileRecords={["Uri"]}
        socialRecords={[]}
        isTld={false}
      />,
    );
    expect(
      screen.getByRole("link", { name: /https:\/\/example\.com/ }),
    ).toHaveAttribute("href", "https://example.com");
  });

  // Price is stored as a bare number; the "$" belongs to presentation, and
  // dropping it would silently change what the number means.
  it("suffixes a Price record with its currency", () => {
    render(
      <DetailsContent
        domain={withRecords}
        profileRecords={["Price"]}
        socialRecords={[]}
        isTld={false}
      />,
    );
    expect(screen.getByText("42 $")).toBeInTheDocument();
  });

  it("always offers the short link alongside the profile records", () => {
    render(
      <DetailsContent
        domain={withRecords}
        profileRecords={["Bio"]}
        socialRecords={[]}
        isTld={false}
      />,
    );
    expect(
      screen.getByRole("link", { name: /metanam\.es\/example\.mpc/ }),
    ).toHaveAttribute("href", "https://metanam.es/example.mpc");
  });

  it("lists social records under their own heading with lowercased labels", () => {
    render(
      <DetailsContent
        domain={withRecords}
        profileRecords={[]}
        socialRecords={["Twitter"]}
        isTld={false}
      />,
    );
    expect(screen.getByText("Social")).toBeInTheDocument();
    expect(screen.getByText("twitter")).toBeInTheDocument();
    expect(screen.getByText("@example")).toBeInTheDocument();
  });
});
