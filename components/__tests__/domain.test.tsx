import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Domain } from "../domain";
import type { Domain as DomainType } from "@/lib/types";

const push = vi.hoisted(() => vi.fn());
const createRecordRepository = vi.hoisted(() => vi.fn());
const walletState = vi.hoisted(() => ({ address: "0xowner" }));
const sdkState = vi.hoisted(() => ({ metaNamesSdk: {} as object | undefined }));
const recordState = vi.hoisted(() => ({
  repository: null as object | null,
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

vi.mock("@/lib/stores/wallet-store", () => ({
  useWalletStore: (selector: (s: typeof walletState) => unknown) =>
    selector(walletState),
}));

vi.mock("@/lib/stores/sdk-store", () => ({
  useSdkStore: (selector: (s: typeof sdkState) => unknown) =>
    selector(sdkState),
}));

vi.mock("@/lib/stores/record-store", () => ({
  useRecordStore: (
    selector: (s: {
      repository: object | null;
      setRepository: () => void;
      clear: () => void;
    }) => unknown,
  ) =>
    selector({
      repository: recordState.repository,
      setRepository: vi.fn(),
      clear: vi.fn(),
    }),
}));

vi.mock("@/lib/records", () => ({ createRecordRepository }));

vi.mock("../records", () => ({
  Records: () => <div data-testid="records-panel" />,
}));

vi.mock("../domain-avatar", () => ({
  JdenticonAvatar: () => <div />,
}));

const NOW = new Date("2026-06-01T12:00:00.000Z");

function inDays(days: number): Date {
  return new Date(NOW.getTime() + days * 86_400_000);
}

function domain(overrides: Partial<DomainType> = {}): DomainType {
  return {
    name: "alice.mpc",
    nameWithoutTLD: "alice",
    owner: "0xowner",
    tokenId: 7,
    createdAt: NOW,
    expiresAt: inDays(400),
    parentId: null,
    records: {},
    ...overrides,
  };
}

describe("Domain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(NOW);
    walletState.address = "0xowner";
    sdkState.metaNamesSdk = {};
    recordState.repository = null;
    createRecordRepository.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("settings tab", () => {
    // A blank panel reads as "this domain has no settings" rather than
    // "the chain read is still in flight".
    it("explains itself while the record repository loads", () => {
      render(<Domain domain={domain()} />);
      fireEvent.click(screen.getByTestId("tab-settings"));
      expect(screen.getByText("Loading records...")).toBeInTheDocument();
      expect(screen.queryByTestId("records-panel")).not.toBeInTheDocument();
    });

    it("swaps in the records once the repository resolves", () => {
      recordState.repository = {};
      render(<Domain domain={domain()} />);
      fireEvent.click(screen.getByTestId("tab-settings"));
      expect(screen.getByTestId("records-panel")).toBeInTheDocument();
      expect(screen.queryByText("Loading records...")).not.toBeInTheDocument();
    });
  });

  describe("expiry warning", () => {
    it("stays hidden while expiry is far off", () => {
      render(<Domain domain={domain()} />);
      expect(screen.queryByTestId("expiry-renew")).not.toBeInTheDocument();
    });

    it("offers the owner a renew action beside the warning", () => {
      render(<Domain domain={domain({ expiresAt: inDays(5) })} />);
      fireEvent.click(screen.getByTestId("expiry-renew"));
      expect(push).toHaveBeenCalledWith("/domain/alice.mpc/renew");
    });

    // A visitor cannot renew someone else's domain; offering the button
    // would send them to a page that refuses them.
    it("shows no renew action to a non-owner", () => {
      walletState.address = "0xsomeone-else";
      render(<Domain domain={domain({ expiresAt: inDays(5) })} />);
      expect(screen.getByText(/Expires in 5 days/)).toBeInTheDocument();
      expect(screen.queryByTestId("expiry-renew")).not.toBeInTheDocument();
    });

    it("reports an already-expired domain as expired, not as negative days", () => {
      render(<Domain domain={domain({ expiresAt: inDays(-3) })} />);
      expect(screen.getByText(/^Expired on /)).toBeInTheDocument();
    });
  });

  describe("calendar reminder", () => {
    it("downloads an .ics named after the domain", () => {
      const createObjectURL = vi.fn(() => "blob:ics");
      const revokeObjectURL = vi.fn();
      vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
      const click = vi
        .spyOn(HTMLAnchorElement.prototype, "click")
        .mockImplementation(() => {});

      render(<Domain domain={domain()} />);
      fireEvent.click(
        screen.getByRole("button", {
          name: "Add expiry reminder to calendar",
        }),
      );

      expect(createObjectURL).toHaveBeenCalledOnce();
      expect(click).toHaveBeenCalledOnce();
      // The blob URL is released as soon as the download is handed off;
      // leaking one per click would pin the file in memory for the session.
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:ics");

      click.mockRestore();
      vi.unstubAllGlobals();
    });

    it("hides the reminder for a domain that never expires", () => {
      render(<Domain domain={domain({ expiresAt: null })} />);
      expect(
        screen.queryByTestId("add-expiry-reminder"),
      ).not.toBeInTheDocument();
    });

    it("hides the reminder from a non-owner", () => {
      walletState.address = "0xsomeone-else";
      render(<Domain domain={domain()} />);
      expect(
        screen.queryByTestId("add-expiry-reminder"),
      ).not.toBeInTheDocument();
    });
  });

  describe("ownership", () => {
    it("matches the owner regardless of address casing", () => {
      walletState.address = "0XOWNER";
      render(<Domain domain={domain()} />);
      expect(screen.getByText("Yours")).toBeInTheDocument();
    });

    it("offers no owner actions on a TLD", () => {
      render(<Domain domain={domain({ name: "mpc" })} isTld />);
      expect(
        screen.queryByRole("button", { name: "Transfer" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("copy", () => {
    it("copies the domain name and confirms it to a screen reader", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });

      render(<Domain domain={domain()} />);
      fireEvent.click(screen.getByRole("button", { name: "Copy alice.mpc" }));

      await waitFor(() => {
        expect(writeText).toHaveBeenCalledWith("alice.mpc");
        expect(screen.getByText("Copied to the clipboard")).toBeInTheDocument();
      });
      vi.unstubAllGlobals();
    });
  });
});
