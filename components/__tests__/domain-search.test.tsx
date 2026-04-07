import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { DomainSearch } from "../domain-search";
import { useSdkStore } from "@/lib/stores/sdk-store";
import { validateDomainName, normalizeDomain } from "@/lib/domain-validator";

vi.mock("@/lib/stores/sdk-store", () => ({
  useSdkStore: vi.fn(),
}));

vi.mock("@/lib/domain-validator", () => ({
  validateDomainName: vi.fn(),
  normalizeDomain: vi.fn((name: string) =>
    name.endsWith(".mpc") ? name : `${name}.mpc`,
  ),
}));

describe("DomainSearch", () => {
  const mockFind = vi.fn();
  const mockMetaNamesSdk = {
    domainRepository: { find: mockFind },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSdkStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      metaNamesSdk: mockMetaNamesSdk,
    });
    (validateDomainName as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      { valid: true },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("renders search input with placeholder", () => {
      render(<DomainSearch />);
      const input = screen.getByPlaceholderText("Search for a .mpc domain...");
      expect(input).toBeInTheDocument();
    });
  });

  describe("Validation", () => {
    it("allows 1-letter domain search", async () => {
      (
        validateDomainName as unknown as ReturnType<typeof vi.fn>
      ).mockReturnValue({ valid: true });
      mockFind.mockResolvedValue(null);

      render(<DomainSearch />);
      const input = screen.getByPlaceholderText("Search for a .mpc domain...");
      await act(async () => {
        fireEvent.change(input, { target: { value: "a" } });
      });

      await waitFor(() => {
        expect(screen.getByText("Available")).toBeInTheDocument();
      });
    });

    it("shows validation error for invalid domain (special chars)", async () => {
      (
        validateDomainName as unknown as ReturnType<typeof vi.fn>
      ).mockReturnValue({
        valid: false,
        error: "Domain name can only contain letters, numbers, and hyphens",
      });

      render(<DomainSearch />);
      const input = screen.getByPlaceholderText("Search for a .mpc domain...");
      await act(async () => {
        fireEvent.change(input, { target: { value: "invalid@domain" } });
      });

      await waitFor(() => {
        expect(
          screen.getByText(
            "Domain name can only contain letters, numbers, and hyphens",
          ),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Loading state", () => {
    it("shows loading spinner while checking", async () => {
      mockFind.mockImplementation(() => new Promise(() => {}));

      render(<DomainSearch />);
      const input = screen.getByPlaceholderText("Search for a .mpc domain...");
      await act(async () => {
        fireEvent.change(input, { target: { value: "testdomain" } });
      });

      await waitFor(() => {
        expect(
          screen.getByText("Checking availability..."),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Domain availability", () => {
    it('shows "Available" badge for new domain', async () => {
      mockFind.mockResolvedValue(null);

      render(<DomainSearch />);
      const input = screen.getByPlaceholderText("Search for a .mpc domain...");
      await act(async () => {
        fireEvent.change(input, { target: { value: "newdomain" } });
      });

      await waitFor(() => {
        expect(screen.getByText("Available")).toBeInTheDocument();
      });
    });

    it('shows "Registered" badge for existing domain', async () => {
      mockFind.mockResolvedValue({ name: "existing.mpc", owner: "0x123" });

      render(<DomainSearch />);
      const input = screen.getByPlaceholderText("Search for a .mpc domain...");
      await act(async () => {
        fireEvent.change(input, { target: { value: "existing" } });
      });

      await waitFor(() => {
        expect(screen.getByText("Registered")).toBeInTheDocument();
      });
    });
  });

  describe("Navigation", () => {
    it("navigates to /register/{name} for available domain", async () => {
      mockFind.mockResolvedValue(null);

      render(<DomainSearch />);
      const input = screen.getByPlaceholderText("Search for a .mpc domain...");
      await act(async () => {
        fireEvent.change(input, { target: { value: "newdomain" } });
      });

      await waitFor(() => {
        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "/register/newdomain");
      });
    });

    it("navigates to /domain/{name} for registered domain", async () => {
      mockFind.mockResolvedValue({ name: "existing.mpc", owner: "0x123" });

      render(<DomainSearch />);
      const input = screen.getByPlaceholderText("Search for a .mpc domain...");
      await act(async () => {
        fireEvent.change(input, { target: { value: "existing" } });
      });

      await waitFor(() => {
        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "/domain/existing.mpc");
      });
    });
  });

  describe("Results clearing", () => {
    it("clears results when input is cleared", async () => {
      mockFind.mockResolvedValue(null);

      render(<DomainSearch />);
      const input = screen.getByPlaceholderText("Search for a .mpc domain...");

      await act(async () => {
        fireEvent.change(input, { target: { value: "testdomain" } });
      });

      await waitFor(() => {
        expect(screen.getByText("Available")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.change(input, { target: { value: "" } });
      });

      await waitFor(() => {
        expect(screen.queryByText("Available")).not.toBeInTheDocument();
        expect(
          screen.queryByText("Checking availability..."),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Debouncing", () => {
    it("debounces the search (does not search on every keystroke)", async () => {
      mockFind.mockResolvedValue(null);
      vi.useFakeTimers();

      render(<DomainSearch />);
      const input = screen.getByPlaceholderText("Search for a .mpc domain...");

      await act(async () => {
        fireEvent.change(input, { target: { value: "a" } });
      });

      expect(mockFind).not.toHaveBeenCalled();

      await act(async () => {
        fireEvent.change(input, { target: { value: "ab" } });
      });

      expect(mockFind).not.toHaveBeenCalled();

      await act(async () => {
        fireEvent.change(input, { target: { value: "abc" } });
      });

      expect(mockFind).not.toHaveBeenCalled();

      await act(async () => {
        vi.runAllTimers();
      });

      expect(mockFind).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });
});
