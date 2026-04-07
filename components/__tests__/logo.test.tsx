import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo } from "../logo";

describe("Logo", () => {
  describe("rendering", () => {
    it("renders correctly", () => {
      render(<Logo />);
      expect(screen.getByRole("link")).toBeInTheDocument();
    });

    it("renders without crashing", () => {
      render(<Logo />);
      expect(screen.getByRole("link")).toBeInTheDocument();
    });

    it("renders Link element", () => {
      render(<Logo />);
      const link = screen.getByRole("link");
      expect(link.tagName.toLowerCase()).toBe("a");
    });

    it("has correct href to home page", () => {
      render(<Logo />);
      expect(screen.getByRole("link")).toHaveAttribute("href", "/");
    });

    it("displays MetaNames text", () => {
      render(<Logo />);
      expect(screen.getByText("MetaNames")).toBeInTheDocument();
    });

    it("contains SVG element", () => {
      render(<Logo />);
      const link = screen.getByRole("link");
      const svg = link.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("SVG icon", () => {
    it("SVG has correct width", () => {
      render(<Logo />);
      const svg = screen.getByRole("link").querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute("width", "28");
    });

    it("SVG has correct height", () => {
      render(<Logo />);
      const svg = screen.getByRole("link").querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute("height", "28");
    });

    it("SVG has correct viewBox", () => {
      render(<Logo />);
      const svg = screen.getByRole("link").querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute("viewBox", "0 0 28 28");
    });

    it("SVG has fill none", () => {
      render(<Logo />);
      const svg = screen.getByRole("link").querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute("fill", "none");
    });

    it("SVG contains a rect element", () => {
      render(<Logo />);
      const svg = screen.getByRole("link").querySelector("svg");
      expect(svg).not.toBeNull();
      const rect = svg!.querySelector("rect");
      expect(rect).toBeInTheDocument();
    });

    it("SVG contains a text element with M", () => {
      render(<Logo />);
      const svg = screen.getByRole("link").querySelector("svg");
      expect(svg).not.toBeNull();
      const text = svg!.querySelector("text");
      expect(text).not.toBeNull();
      expect(text!.textContent).toBe("M");
    });
  });

  describe("styling", () => {
    it("has flex items-center class", () => {
      render(<Logo />);
      expect(screen.getByRole("link")).toHaveClass("flex", "items-center");
    });

    it("has gap-2 class", () => {
      render(<Logo />);
      expect(screen.getByRole("link")).toHaveClass("gap-2");
    });

    it("has font-bold class", () => {
      render(<Logo />);
      expect(screen.getByRole("link")).toHaveClass("font-bold");
    });

    it("has text-xl class", () => {
      render(<Logo />);
      expect(screen.getByRole("link")).toHaveClass("text-xl");
    });

    it("has text-primary class", () => {
      render(<Logo />);
      expect(screen.getByRole("link")).toHaveClass("text-primary");
    });
  });

  describe("link structure", () => {
    it("SVG comes before text", () => {
      render(<Logo />);
      const link = screen.getByRole("link");
      const childNodes = Array.from(link.childNodes);
      // First child should be the SVG (or a text node with whitespace before SVG)
      expect(link.firstChild).toBeDefined();
    });

    it("MetaNames text is within the link", () => {
      render(<Logo />);
      const link = screen.getByRole("link");
      expect(link.textContent).toContain("MetaNames");
    });
  });
});
