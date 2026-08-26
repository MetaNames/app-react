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
