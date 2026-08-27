import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WalletConnectButton } from "../wallet-connect-button";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { useSdkStore } from "@/lib/stores/sdk-store";
import type { MetaNamesSdk } from "@metanames/sdk";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

const connectMetaMask = vi.fn();
const connectPartisiaWallet = vi.fn();
const connectLedger = vi.fn();
const connectDevPrivateKey = vi.fn();
const disconnectWallet = vi.fn();

vi.mock("@/lib/wallet", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/wallet")>();
  return {
    ...actual,
    connectMetaMask: (...args: unknown[]) => connectMetaMask(...args),
    connectPartisiaWallet: (...args: unknown[]) =>
      connectPartisiaWallet(...args),
    connectLedger: (...args: unknown[]) => connectLedger(...args),
    connectDevPrivateKey: (...args: unknown[]) => connectDevPrivateKey(...args),
    disconnectWallet: (...args: unknown[]) => disconnectWallet(...args),
  };
});

vi.mock("@/lib/config", () => ({
  config: { isTestnet: true },
}));

// base-ui's Menu primitives need real positioning/portals that jsdom does not
// provide; a plain-element mock keeps the button's own connect/error logic
// under test without fighting the popup implementation.
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuTrigger: ({
    children,
    ...props
  }: React.ComponentProps<"button">) => <button {...props}>{children}</button>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
  DropdownMenuSeparator: () => <hr />,
}));

import * as Sentry from "@sentry/nextjs";
import { toast } from "sonner";

function sdkStub(): MetaNamesSdk {
  return {} as MetaNamesSdk;
}

describe("WalletConnectButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWalletStore.setState({ address: undefined });
    useSdkStore.setState({ metaNamesSdk: sdkStub() });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Gap #3: wallet connect failures must be reported to Sentry, matching
  // legacy's `connectWallet` orchestrator (app-legacy/src/lib/wallet-connect.ts).
  it("reports a MetaMask connect failure to Sentry and shows the raw error as a toast", async () => {
    connectMetaMask.mockRejectedValue(new Error("MetaMask not found"));
    render(<WalletConnectButton />);

    fireEvent.click(screen.getByText("MetaMask Wallet"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("MetaMask not found");
    });
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: "MetaMask not found" }),
      expect.objectContaining({ extra: { wallet: "metamask" } }),
    );
  });

  it("sets the address and shows a success toast on a successful connect", async () => {
    connectPartisiaWallet.mockResolvedValue("0xaddress");
    render(<WalletConnectButton />);

    fireEvent.click(screen.getByText("Partisia Wallet"));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Wallet connected");
    });
    expect(useWalletStore.getState().address).toBe("0xaddress");
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  // Deliberately not reported — the failure context could carry the dev
  // private key, matching legacy's silent-Sentry contract for private keys.
  it("does NOT report a dev private-key connect failure to Sentry", async () => {
    connectDevPrivateKey.mockRejectedValue(new Error("Invalid private key"));
    render(<WalletConnectButton />);

    const key = "a".repeat(64);
    fireEvent.change(screen.getByTestId("dev-key-input"), {
      target: { value: key },
    });
    fireEvent.click(screen.getByTestId("dev-key-connect-button"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid private key");
    });
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("shows the connected state with the connect-button testid gone", () => {
    useWalletStore.setState({ address: "0x1234567890abcdef1234567890" });
    render(<WalletConnectButton />);

    expect(screen.getByTestId("wallet-connected")).toBeInTheDocument();
    expect(
      screen.queryByTestId("wallet-connect-button"),
    ).not.toBeInTheDocument();
  });

  it("connects through Ledger and stores the returned address", async () => {
    connectLedger.mockResolvedValue("0xledger");
    render(<WalletConnectButton />);

    fireEvent.click(screen.getByText("Ledger"));

    await waitFor(() => {
      expect(useWalletStore.getState().address).toBe("0xledger");
    });
    expect(toast.success).toHaveBeenCalledWith("Wallet connected");
  });

  it("connects with a valid dev key and reports it as a dev connection", async () => {
    connectDevPrivateKey.mockResolvedValue("0xdev");
    render(<WalletConnectButton />);

    const key = "a".repeat(64);
    fireEvent.change(screen.getByTestId("dev-key-input"), {
      target: { value: key },
    });
    fireEvent.click(screen.getByTestId("dev-key-connect-button"));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Dev wallet connected");
    });
    expect(connectDevPrivateKey).toHaveBeenCalledWith(expect.anything(), key);
  });

  // A half-typed key must not be submittable: the connector would reject it and
  // the user would read a cryptic failure instead of "keep typing".
  it("keeps the dev connect button disabled until the key is 64 hex chars", () => {
    render(<WalletConnectButton />);
    const button = screen.getByTestId("dev-key-connect-button");

    expect(button).toBeDisabled();

    fireEvent.change(screen.getByTestId("dev-key-input"), {
      target: { value: "a".repeat(63) },
    });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByTestId("dev-key-input"), {
      target: { value: "a".repeat(64) },
    });
    expect(button).toBeEnabled();
  });

  // Clicking a connector before the SDK finishes booting is a no-op rather than
  // a crash, and must not leave a half-connected address behind.
  it("ignores a connect click while the SDK is still initialising", async () => {
    useSdkStore.setState({ metaNamesSdk: undefined });
    render(<WalletConnectButton />);

    fireEvent.click(screen.getByText("MetaMask Wallet"));

    await waitFor(() => {
      expect(connectMetaMask).not.toHaveBeenCalled();
    });
    expect(useWalletStore.getState().address).toBeUndefined();
  });

  it("tells the user to wait when a dev key is submitted before the SDK is ready", async () => {
    useSdkStore.setState({ metaNamesSdk: undefined });
    render(<WalletConnectButton />);

    fireEvent.change(screen.getByTestId("dev-key-input"), {
      target: { value: "a".repeat(64) },
    });
    fireEvent.click(screen.getByTestId("dev-key-connect-button"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("SDK not ready, please wait...");
    });
    expect(connectDevPrivateKey).not.toHaveBeenCalled();
  });

  it("clears the address and resets the signing strategy on disconnect", async () => {
    useWalletStore.setState({ address: "0x1234567890abcdef1234567890" });
    render(<WalletConnectButton />);

    fireEvent.click(screen.getByText("Disconnect"));

    await waitFor(() => {
      expect(useWalletStore.getState().address).toBeUndefined();
    });
    expect(disconnectWallet).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Wallet disconnected");
  });
});
