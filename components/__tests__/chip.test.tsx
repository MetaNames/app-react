import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Chip } from "../chip";

const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};
Object.defineProperty(window, "navigator", {
  value: {
    clipboard: mockClipboard,
  },
  configurable: true,
});

describe("Chip", () => {
  beforeEach(() => {
    mockClipboard.writeText.mockClear();
  });

  describe("rendering", () => {
    it("renders with default variant", () => {
      render(<Chip label="name" value="test.mpc" />);
      expect(screen.getByText("name")).toBeInTheDocument();
      expect(screen.getByText("test.mpc")).toBeInTheDocument();
    });

    it("renders with available variant without crashing", () => {
      render(<Chip label="status" value="Available" variant="available" />);
      expect(screen.getByText("Available")).toBeInTheDocument();
    });

    it("renders with registered variant without crashing", () => {
      render(<Chip label="status" value="Registered" variant="registered" />);
      expect(screen.getByText("Registered")).toBeInTheDocument();
    });

    it("renders with label only when no value", () => {
      render(<Chip label="label-only" />);
      expect(screen.getByText("label-only")).toBeInTheDocument();
    });

    it("renders with href as link", () => {
      render(
        <Chip
          label="link"
          value="https://example.com"
          href="https://example.com"
        />,
      );
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "https://example.com");
    });

    it("renders with onClick as button", () => {
      const onClick = vi.fn();
      render(<Chip label="click" value="click me" onClick={onClick} />);
      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe("copy to clipboard", () => {
    it("copies value to clipboard when clicked without href or onClick", async () => {
      render(<Chip label="copy" value="test.mpc" />);
      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(mockClipboard.writeText).toHaveBeenCalledWith("test.mpc");
    });

    it("does not copy when href is present", () => {
      render(
        <Chip
          label="link"
          value="https://example.com"
          href="https://example.com"
        />,
      );
      const link = screen.getByRole("link");
      fireEvent.click(link);
      expect(mockClipboard.writeText).not.toHaveBeenCalled();
    });

    it("does not copy when onClick is present", () => {
      const onClick = vi.fn();
      render(<Chip label="click" value="test.mpc" onClick={onClick} />);
      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(mockClipboard.writeText).not.toHaveBeenCalled();
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe("icons", () => {
    it("shows external link icon when href is provided", () => {
      render(<Chip label="external" value="link" href="https://example.com" />);
      const link = screen.getByRole("link");
      const svgIcons = link.querySelectorAll("svg");
      expect(svgIcons.length).toBeGreaterThan(0);
    });

    it("shows copy icon when no href or onClick", () => {
      render(<Chip label="copy" value="test.mpc" />);
      const button = screen.getByRole("button");
      const svgIcons = button.querySelectorAll("svg");
      expect(svgIcons.length).toBeGreaterThan(0);
    });
  });
});
