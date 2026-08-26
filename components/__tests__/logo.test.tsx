import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo, LogoMark } from "../logo";

describe("Logo", () => {
  describe("rendering", () => {
    it("renders correctly", () => {
      render(<Logo />);
      expect(screen.getByRole("link")).toBeInTheDocument();
    });

    it("renders the link mark and wordmark", () => {
      render(<Logo />);
      const link = screen.getByRole("link", { name: /metanames/i });
      expect(link).toHaveAttribute("href", "/");
      expect(link.querySelector("svg")).toHaveAttribute(
        "viewBox",
        "275 35 250 430",
      );
    });

    it("has correct href to home page", () => {
      render(<Logo />);
      expect(screen.getByRole("link")).toHaveAttribute("href", "/");
    });

    it("displays metanames text", () => {
      render(<Logo />);
      expect(screen.getByText("metanames")).toBeInTheDocument();
    });

    it("contains SVG element", () => {
      render(<Logo />);
      const link = screen.getByRole("link");
      const svg = link.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("SVG icon", () => {
    it("SVG has correct viewBox", () => {
      render(<Logo />);
      const svg = screen.getByRole("link").querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute("viewBox", "275 35 250 430");
    });

    it("SVG is hidden from accessibility tree", () => {
      render(<Logo />);
      const svg = screen.getByRole("link").querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });

    it("SVG contains two path elements", () => {
      render(<Logo />);
      const svg = screen.getByRole("link").querySelector("svg");
      expect(svg).not.toBeNull();
      const paths = svg!.querySelectorAll("path");
      expect(paths.length).toBe(2);
    });
  });

  describe("styling", () => {
    it("has flex items-center class", () => {
      render(<Logo />);
      expect(screen.getByRole("link")).toHaveClass("flex", "items-center");
    });

    it("has font-extrabold class", () => {
      render(<Logo />);
      expect(screen.getByRole("link")).toHaveClass("font-extrabold");
    });
  });

  describe("link structure", () => {
    it("metanames text is within the link", () => {
      render(<Logo />);
      const link = screen.getByRole("link");
      expect(link.textContent).toContain("metanames");
    });
  });
});

describe("LogoMark", () => {
  it("renders with default size and viewBox", () => {
    const { container } = render(<LogoMark />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("viewBox", "275 35 250 430");
    expect(svg).toHaveAttribute("height", "26");
  });

  it("scales width/height proportionally to the given size", () => {
    const { container } = render(<LogoMark size={43} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("height", "43");
    expect(svg).toHaveAttribute("width", String((43 * 250) / 430));
  });

  it("applies the passed className", () => {
    const { container } = render(<LogoMark className="text-primary" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("text-primary");
  });
});
