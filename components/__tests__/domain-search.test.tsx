import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { DomainSearch } from "../domain-search";
import { validateDomainName } from "@/lib/domain-validator";
import { useRecentSearchesStore } from "@/lib/stores/recent-searches-store";

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

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
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

  describe("Enter key search", () => {
    it("triggers search immediately on Enter key", async () => {
      mockFind.mockResolvedValue(null);

      render(<DomainSearch />);
      const input = screen.getByPlaceholderText("Search for a .mpc domain...");

      await act(async () => {
        fireEvent.change(input, { target: { value: "entertest" } });
      });

      expect(mockFind).not.toHaveBeenCalled();

      await act(async () => {
        fireEvent.keyDown(input, { key: "Enter" });
      });

      expect(mockFind).toHaveBeenCalledTimes(1);
      expect(mockFind).toHaveBeenCalledWith("entertest.mpc");
    });

    it("does not trigger search on Enter when input is empty", async () => {
      render(<DomainSearch />);
      const input = screen.getByPlaceholderText("Search for a .mpc domain...");

      await act(async () => {
        fireEvent.keyDown(input, { key: "Enter" });
      });

      expect(mockFind).not.toHaveBeenCalled();
    });

    it("shows validation error on Enter for invalid domain", async () => {
      (
        validateDomainName as unknown as ReturnType<typeof vi.fn>
      ).mockReturnValue({
        valid: false,
        error: "Invalid domain format",
      });

      render(<DomainSearch />);
      const input = screen.getByPlaceholderText("Search for a .mpc domain...");

      await act(async () => {
        fireEvent.change(input, { target: { value: "invalid@" } });
      });

      await act(async () => {
        fireEvent.keyDown(input, { key: "Enter" });
      });

      await waitFor(() => {
        expect(screen.getByText("Invalid domain format")).toBeInTheDocument();
      });
    });
  });

  describe("keyboard shortcut", () => {
    it("focuses the search box when / is pressed elsewhere on the page", () => {
      render(<DomainSearch />);
      const input = screen.getByPlaceholderText("Search for a .mpc domain...");
      expect(input).not.toHaveFocus();

      fireEvent.keyDown(document.body, { key: "/" });

      expect(input).toHaveFocus();
    });

    it("focuses the search box on Cmd+K and on Ctrl+K", () => {
      render(<DomainSearch />);
      const input = screen.getByPlaceholderText("Search for a .mpc domain...");

      fireEvent.keyDown(document.body, { key: "k", metaKey: true });
      expect(input).toHaveFocus();

      input.blur();
      fireEvent.keyDown(document.body, { key: "K", ctrlKey: true });
      expect(input).toHaveFocus();
    });

    // Otherwise a "/" typed into any other field on the page would be
    // swallowed and yank focus away mid-sentence.
    it("leaves / alone while another field has focus", () => {
      render(
        <>
          <DomainSearch />
          <input aria-label="other" />
        </>,
      );
      const other = screen.getByLabelText("other");
      other.focus();

      fireEvent.keyDown(other, { key: "/" });

      expect(other).toHaveFocus();
    });
  });

  describe("Suggestions for a taken name", () => {
    const search = async (value: string) => {
      render(<DomainSearch />);
      const input = screen.getByPlaceholderText("Search for a .mpc domain...");
      await act(async () => {
        fireEvent.change(input, { target: { value } });
      });
    };

    it("offers available variations when the searched name is taken", async () => {
      // The searched name resolves to a domain; every variation is free.
      mockFind.mockImplementation(async (name: string) =>
        name === "alice.mpc" ? { name } : null,
      );

      await search("alice");

      await waitFor(() => {
        expect(screen.getByTestId("name-suggestions")).toBeInTheDocument();
      });
      const links = screen
        .getByTestId("name-suggestions")
        .querySelectorAll("a");
      expect(links.length).toBeGreaterThan(0);
      expect(links[0].getAttribute("href")).toMatch(/^\/register\//);
    });

    it("shows at most four suggestions", async () => {
      mockFind.mockImplementation(async (name: string) =>
        name === "alice.mpc" ? { name } : null,
      );

      await search("alice");

      await waitFor(() => {
        expect(
          screen.getByTestId("name-suggestions").querySelectorAll("a"),
        ).toHaveLength(4);
      });
    });

    it("never suggests a variation that is itself taken", async () => {
      mockFind.mockImplementation(async (name: string) =>
        name === "alice.mpc" || name === "alicehq.mpc" ? { name } : null,
      );

      await search("alice");

      await waitFor(() => {
        expect(screen.getByTestId("name-suggestions")).toBeInTheDocument();
      });
      expect(screen.queryByText("alicehq.mpc")).not.toBeInTheDocument();
    });

    it("stays quiet when the searched name is available", async () => {
      mockFind.mockResolvedValue(null);

      await search("alice");

      await waitFor(() => {
        expect(screen.getByText("Available")).toBeInTheDocument();
      });
      expect(screen.queryByTestId("name-suggestions")).not.toBeInTheDocument();
    });

    // A lookup that throws should cost that one suggestion, not the whole row.
    it("keeps the suggestions it could verify when a lookup fails", async () => {
      mockFind.mockImplementation(async (name: string) => {
        if (name === "alice.mpc") return { name };
        if (name === "alicehq.mpc") throw new Error("rpc down");
        return null;
      });

      await search("alice");

      await waitFor(() => {
        expect(
          screen.getByTestId("name-suggestions").querySelectorAll("a").length,
        ).toBeGreaterThan(0);
      });
      expect(screen.queryByText("alicehq.mpc")).not.toBeInTheDocument();
    });
  });
  describe("Recent searches", () => {
    beforeEach(() => {
      useRecentSearchesStore.setState({ names: [] });
    });

    const searchAndClear = async (value: string) => {
      render(<DomainSearch />);
      const input = screen.getByPlaceholderText("Search for a .mpc domain...");
      await act(async () => {
        fireEvent.change(input, { target: { value } });
      });
      await waitFor(() => {
        expect(useRecentSearchesStore.getState().names).toContain(
          `${value}.mpc`,
        );
      });
      await act(async () => {
        fireEvent.change(input, { target: { value: "" } });
      });
      return input;
    };

    it("offers the last searched name once the box is empty again", async () => {
      await searchAndClear("alice");

      const row = await screen.findByTestId("recent-searches");
      expect(row).toHaveTextContent("alice.mpc");
    });

    it("puts a remembered name back in the box when clicked", async () => {
      const input = await searchAndClear("alice");

      fireEvent.click(await screen.findByText("alice.mpc"));

      expect(input).toHaveValue("alice");
    });

    it("empties the row on request", async () => {
      await searchAndClear("alice");

      fireEvent.click(await screen.findByTestId("clear-recent-searches"));

      await waitFor(() => {
        expect(screen.queryByTestId("recent-searches")).not.toBeInTheDocument();
      });
    });

    // A failed lookup never reached the chain, so it is not a search anyone
    // would recognise in the row.
    it("remembers nothing when the lookup fails", async () => {
      mockFind.mockRejectedValue(new Error("rpc down"));
      render(<DomainSearch />);
      const input = screen.getByPlaceholderText("Search for a .mpc domain...");

      await act(async () => {
        fireEvent.change(input, { target: { value: "alice" } });
      });
      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      expect(useRecentSearchesStore.getState().names).toEqual([]);
    });

    it("shows the example names only while there is no history", async () => {
      render(<DomainSearch />);
      expect(screen.getByText("satoshi.mpc")).toBeInTheDocument();

      useRecentSearchesStore.setState({ names: ["alice.mpc"] });

      await waitFor(() => {
        expect(screen.queryByText("satoshi.mpc")).not.toBeInTheDocument();
      });
    });
  });
});
