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
import { validateDomainName } from "@/lib/domain-validator";

const mockFind = vi.hoisted(() => vi.fn());

vi.mock("@/lib/stores/sdk-store", () => {
  const mockSdk = {
    domainRepository: { find: mockFind },
  };
  return {
    useSdkStore: vi.fn().mockImplementation((selector) => {
      const state = {
        metaNamesSdk: mockSdk,
        availableCoins: [],
        selectedCoin: "ETH",
        setMetaNamesSdk: vi.fn(),
        setSelectedCoin: vi.fn(),
      };
      return selector ? selector(state) : state;
    }),
  };
});

vi.mock("@/lib/domain-validator", () => ({
  validateDomainName: vi.fn().mockReturnValue({ valid: true }),
  normalizeDomain: vi.fn((name: string) =>
    name.endsWith(".mpc") ? name : `${name}.mpc`,
  ),
}));

describe("DomainSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFind.mockResolvedValue(null);
    (validateDomainName as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      {
        valid: true,
      },
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

  // TODO: Fix Zustand mocking - vi.mock doesn't properly intercept create() stores
  it.skip("debounces the search (does not search on every keystroke)", async () => {
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
