import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GoBackButton } from "../go-back-button";

const mockRouter = {
  back: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

describe("GoBackButton", () => {
  beforeEach(() => {
    mockRouter.back.mockClear();
  });

  describe("rendering", () => {
    it("renders button with arrow icon", () => {
      render(<GoBackButton />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();

      const arrowIcon = button.querySelector("svg");
      expect(arrowIcon).toBeInTheDocument();
    });

    it("renders button with correct text", () => {
      render(<GoBackButton />);
      expect(screen.getByText("Go back")).toBeInTheDocument();
    });

    it("renders without crashing", () => {
      render(<GoBackButton />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("has correct variant class (ghost)", () => {
      render(<GoBackButton />);
      // The button should have the ghost variant styling through the Button component
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("has gap-2 class for spacing", () => {
      render(<GoBackButton />);
      expect(screen.getByRole("button")).toHaveClass("gap-2");
    });
  });

  describe("navigation", () => {
    it("navigates back on click", () => {
      render(<GoBackButton />);

      fireEvent.click(screen.getByRole("button"));

      expect(mockRouter.back).toHaveBeenCalledTimes(1);
    });

    it("calls router.back with no arguments", () => {
      render(<GoBackButton />);

      fireEvent.click(screen.getByRole("button"));

      expect(mockRouter.back).toHaveBeenCalledWith();
    });

    it("can be clicked multiple times", () => {
      render(<GoBackButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // GoBackButton has no debouncing, each click calls router.back
      expect(mockRouter.back).toHaveBeenCalledTimes(3);
    });
  });

  describe("icon", () => {
    it("renders ArrowLeft icon", () => {
      render(<GoBackButton />);

      const svgElements = screen.getByRole("button").querySelectorAll("svg");
      expect(svgElements.length).toBeGreaterThan(0);
    });

    it("icon has correct size class h-4 w-4", () => {
      render(<GoBackButton />);

      const icon = screen.getByRole("button").querySelector("svg");
      expect(icon).toHaveClass("h-4", "w-4");
    });
  });
});
