import { Children, isValidElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DomainPayment } from "../domain-payment";
import { useDomainPayment } from "@/lib/hooks/use-domain-payment";

// base-ui's Select needs real positioning and portals that jsdom does not
// provide. A native <select> stand-in keeps this file testing which controls
// the component renders, rather than the popup implementation.
vi.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
  }) => {
    const trigger = Children.toArray(children).find((child) =>
      isValidElement<{ "aria-label"?: string }>(child),
    );
    const ariaLabel = isValidElement<{ "aria-label"?: string }>(trigger)
      ? trigger.props["aria-label"]
      : undefined;

    return (
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      >
        {children}
      </select>
    );
  },
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectValue: () => null,
  SelectItem: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => <option value={value}>{children}</option>,
}));

vi.mock("@/lib/hooks/use-domain-payment", () => ({
  useDomainPayment: vi.fn(),
}));

const setSelectedCoin = vi.fn();

function mockPayment(overrides: Record<string, unknown> = {}) {
  vi.mocked(useDomainPayment).mockReturnValue({
    years: 1,
    setYears: vi.fn(),
    fees: { feesLabel: "1.5", symbol: "ETH" },
    feesApproved: false,
    loadingFees: false,
    address: undefined,
    selectedCoin: "ETH",
    setSelectedCoin,
    availableCoins: ["ETH", "USDC"],
    total: "1.5000",
    domainCharCount: 5,
    handleApproveFees: vi.fn(),
    handleSubmit: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useDomainPayment>);
}

describe("DomainPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("without a connected wallet", () => {
    beforeEach(() => mockPayment({ address: undefined }));

    it("renders an accessible payment token selector", () => {
      render(<DomainPayment domain="alice.mpc" mode="register" />);

      expect(
        screen.getByRole("combobox", { name: "Payment token" }),
      ).toBeInTheDocument();
    });

    it("switches the token, so the quoted price can be compared before connecting", () => {
      render(<DomainPayment domain="alice.mpc" mode="register" />);

      fireEvent.change(
        screen.getByRole("combobox", { name: "Payment token" }),
        {
          target: { value: "USDC" },
        },
      );

      expect(setSelectedCoin).toHaveBeenCalledWith("USDC");
    });

    it("still gates the transaction buttons behind connecting", () => {
      render(<DomainPayment domain="alice.mpc" mode="register" />);

      expect(screen.queryByTestId("approve-fees")).not.toBeInTheDocument();
    });
  });

  describe("with a connected wallet", () => {
    beforeEach(() => mockPayment({ address: "00abc" }));

    it("renders the token selector and the transaction buttons", () => {
      render(<DomainPayment domain="alice.mpc" mode="register" />);

      expect(
        screen.getByRole("combobox", { name: "Payment token" }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("approve-fees")).toBeInTheDocument();
    });
  });
});
