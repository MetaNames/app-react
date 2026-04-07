import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConnectionRequired } from "../connection-required";

describe("ConnectionRequired", () => {
  describe("when address exists", () => {
    it("shows children when address exists", () => {
      render(
        <ConnectionRequired address="0x1234567890abcdef">
          <div data-testid="children">Protected Content</div>
        </ConnectionRequired>,
      );

      expect(screen.getByTestId("children")).toBeInTheDocument();
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("renders multiple children correctly", () => {
      render(
        <ConnectionRequired address="0x1234567890abcdef">
          <span>Child 1</span>
          <span>Child 2</span>
        </ConnectionRequired>,
      );

      expect(screen.getByText("Child 1")).toBeInTheDocument();
      expect(screen.getByText("Child 2")).toBeInTheDocument();
    });

    it("does not show fallback when address exists", () => {
      render(
        <ConnectionRequired
          address="0x1234567890abcdef"
          fallback={<div>Fallback Content</div>}
        >
          <div>Children</div>
        </ConnectionRequired>,
      );

      expect(screen.queryByText("Fallback Content")).not.toBeInTheDocument();
    });

    it("does not show default message when address exists", () => {
      render(
        <ConnectionRequired address="0x1234567890abcdef">
          <div>Children</div>
        </ConnectionRequired>,
      );

      expect(
        screen.queryByText("Connect your wallet to continue"),
      ).not.toBeInTheDocument();
    });
  });

  describe("when no address", () => {
    it("shows fallback when provided and no address", () => {
      render(
        <ConnectionRequired
          address={undefined}
          fallback={<div data-testid="fallback">Please connect</div>}
        >
          <div>Children</div>
        </ConnectionRequired>,
      );

      expect(screen.getByTestId("fallback")).toBeInTheDocument();
      expect(screen.getByText("Please connect")).toBeInTheDocument();
    });

    it("shows default message when no address and no fallback", () => {
      render(
        <ConnectionRequired address={undefined}>
          <div>Children</div>
        </ConnectionRequired>,
      );

      expect(
        screen.getByText("Connect your wallet to continue"),
      ).toBeInTheDocument();
    });

    it("does not show children when no address", () => {
      render(
        <ConnectionRequired address={undefined}>
          <div data-testid="children">Protected Content</div>
        </ConnectionRequired>,
      );

      expect(screen.queryByTestId("children")).not.toBeInTheDocument();
    });

    it("shows fallback content correctly formatted", () => {
      render(
        <ConnectionRequired
          address={undefined}
          fallback={<button>Connect Wallet</button>}
        >
          <div>Content</div>
        </ConnectionRequired>,
      );

      expect(
        screen.getByRole("button", { name: "Connect Wallet" }),
      ).toBeInTheDocument();
    });
  });

  describe("default fallback message", () => {
    it("has correct styling classes for default message", () => {
      render(
        <ConnectionRequired address={undefined}>
          <div>Content</div>
        </ConnectionRequired>,
      );

      const message = screen.getByText("Connect your wallet to continue");
      expect(message).toHaveClass("text-muted-foreground", "text-lg");
    });

    it("default message is centered", () => {
      render(
        <ConnectionRequired address={undefined}>
          <div>Content</div>
        </ConnectionRequired>,
      );

      const container = screen.getByText(
        "Connect your wallet to continue",
      ).parentElement;
      expect(container).toHaveClass(
        "flex",
        "flex-col",
        "items-center",
        "justify-center",
        "py-12",
        "text-center",
        "gap-4",
      );
    });
  });

  describe("edge cases", () => {
    it("handles empty string address as no address", () => {
      render(
        <ConnectionRequired address="">
          <div>Content</div>
        </ConnectionRequired>,
      );

      expect(
        screen.getByText("Connect your wallet to continue"),
      ).toBeInTheDocument();
    });
  });
});
