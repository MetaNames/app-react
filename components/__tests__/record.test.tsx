import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Record } from "../record";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

vi.mock("sonner", () => {
  const fn = vi.fn((message: string) => message);
  return {
    toast: Object.assign(fn, {
      success: vi.fn((message: string) => message),
      error: vi.fn((message: string) => message),
    }),
  };
});

vi.mock("@/lib/url", () => ({
  explorerTransactionUrl: vi.fn(
    (tx: string) =>
      `https://browser.testnet.partisiablockchain.com/transactions/${tx}`,
  ),
  explorerAddressUrl: vi.fn(
    (address: string) =>
      `https://browser.testnet.partisiablockchain.com/accounts/${address}/assets`,
  ),
}));

// `recordLink` stays real: which values become links is the behaviour these
// tests are checking, and a mock would assert only that the mock was called.
vi.mock("@/lib/records", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/records")>()),
  validateRecordValue: vi.fn(() => null),
}));

vi.mock("@/components/ui/button", () => ({
  Button: vi.fn(({ children, disabled, ...props }) => (
    <button disabled={disabled} data-testid={props["data-testid"]} {...props}>
      {children}
    </button>
  )),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode;
    open: boolean;
    onOpenChange?: (open: boolean) => void;
  }) =>
    open ? (
      <div role="dialog" onChange={() => onOpenChange?.(false)}>
        {children}
      </div>
    ) : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/ui/textarea", () => ({
  Textarea: vi.fn(
    ({
      value,
      onChange,
      ...props
    }: {
      value?: string;
      onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
      [key: string]: unknown;
    }) => <textarea value={value} onChange={onChange} {...props} />,
  ),
}));

const mockRepository = {
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock("@/lib/stores/record-store", () => ({
  useRecordStore: vi.fn((selector) => {
    const state = {
      repository: mockRepository,
      setRepository: vi.fn(),
      clear: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

const createMockIntent = () => ({
  transactionHash: "mock-tx-hash",
  fetchResult: Promise.resolve({
    transactionHash: "mock-tx-hash",
    hasError: false,
  }),
});

const defaultProps = {
  type: "Bio" as const,
  value: "Test bio value",
  onUpdate: vi.fn(),
};

describe("Record", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockRepository.create.mockReset();
    mockRepository.update.mockReset();
    mockRepository.delete.mockReset();
  });

  describe("rendering", () => {
    it("renders record type and value", () => {
      render(<Record {...defaultProps} />);
      expect(screen.getByText("Bio")).toBeInTheDocument();
      expect(screen.getByText("Test bio value")).toBeInTheDocument();
    });

    it("renders edit and delete buttons", () => {
      render(<Record {...defaultProps} />);
      expect(screen.getByTestId("edit-record")).toBeInTheDocument();
      expect(screen.getByTestId("delete-record")).toBeInTheDocument();
    });

    it("renders different record types correctly", () => {
      const types: Array<{
        type: "Bio" | "Email" | "Twitter" | "Discord";
        value: string;
      }> = [
        { type: "Bio", value: "My bio" },
        { type: "Email", value: "test@example.com" },
        { type: "Twitter", value: "@user" },
        { type: "Discord", value: "user#1234" },
      ];

      types.forEach(({ type, value }) => {
        const { unmount } = render(
          <Record {...defaultProps} type={type} value={value} />,
        );
        expect(screen.getByText(type)).toBeInTheDocument();
        expect(screen.getByText(value)).toBeInTheDocument();
        unmount();
      });
    });

    it("renders Price record with $ suffix", () => {
      render(<Record {...defaultProps} type="Price" value="100" />);
      expect(screen.getByText("100 $")).toBeInTheDocument();
    });

    it("renders Wallet type correctly", () => {
      render(
        <Record {...defaultProps} type="Wallet" value="0x1234567890abcdef" />,
      );
      expect(screen.getByText("0x1234567890abcdef")).toBeInTheDocument();
    });
  });

  describe("edit mode", () => {
    it("enters edit mode when edit button is clicked", () => {
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId("edit-record"));
      expect(screen.getByTestId("save-record")).toBeInTheDocument();
      expect(screen.getByTestId("cancel-edit")).toBeInTheDocument();
    });

    it("shows textarea in edit mode", () => {
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId("edit-record"));
      const textarea = screen.getByRole("textbox");
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue("Test bio value");
    });

    it("cancels edit mode and restores original value", () => {
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId("edit-record"));

      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value: "Modified value" } });

      fireEvent.click(screen.getByTestId("cancel-edit"));

      expect(screen.getByText("Test bio value")).toBeInTheDocument();
      expect(screen.queryByTestId("save-record")).not.toBeInTheDocument();
    });

    it("clears edit error when canceling", () => {
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId("edit-record"));

      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value: "Modified value" } });

      fireEvent.click(screen.getByTestId("cancel-edit"));

      expect(screen.queryByText("Value is required")).not.toBeInTheDocument();
    });

    it("shows character count in edit mode", () => {
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId("edit-record"));
      expect(screen.getByText("14/64")).toBeInTheDocument();
    });
  });

  describe("save functionality", () => {
    it("calls repository.update with correct parameters", async () => {
      const mockIntent = createMockIntent();
      mockRepository.update.mockResolvedValue(mockIntent);

      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId("edit-record"));

      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value: "Updated bio" } });

      fireEvent.click(screen.getByTestId("save-record"));

      await waitFor(() => {
        expect(mockRepository.update).toHaveBeenCalledWith({
          class: 0,
          data: "Updated bio",
        });
      });
    });

    it("calls onUpdate after successful save", async () => {
      const mockIntent = createMockIntent();
      mockRepository.update.mockResolvedValue(mockIntent);

      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId("edit-record"));
      fireEvent.click(screen.getByTestId("save-record"));

      await waitFor(() => {
        expect(defaultProps.onUpdate).toHaveBeenCalled();
      });
    });

    it("exits edit mode after successful save", async () => {
      const mockIntent = createMockIntent();
      mockRepository.update.mockResolvedValue(mockIntent);

      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId("edit-record"));
      fireEvent.click(screen.getByTestId("save-record"));

      await waitFor(() => {
        expect(screen.queryByTestId("save-record")).not.toBeInTheDocument();
      });
    });

    it("shows toast with transaction link", async () => {
      const { toast } = await import("sonner");
      const mockIntent = createMockIntent();
      mockRepository.update.mockResolvedValue(mockIntent);

      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId("edit-record"));
      fireEvent.click(screen.getByTestId("save-record"));

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          "New Transaction submitted",
          expect.objectContaining({
            duration: 10000,
          }),
        );
      });
    });

    it("displays validation error when validateRecordValue returns error", async () => {
      const { validateRecordValue } = await import("@/lib/records");
      vi.mocked(validateRecordValue).mockReturnValue("Value is required");

      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId("edit-record"));
      fireEvent.click(screen.getByTestId("save-record"));

      await waitFor(() => {
        expect(screen.getByText("Value is required")).toBeInTheDocument();
      });

      vi.mocked(validateRecordValue).mockReturnValue(null);
    });

    it("does not call repository.update when validation fails", async () => {
      const { validateRecordValue } = await import("@/lib/records");
      vi.mocked(validateRecordValue).mockReturnValue("Value is required");

      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId("edit-record"));
      fireEvent.click(screen.getByTestId("save-record"));

      await waitFor(() => {
        expect(mockRepository.update).not.toHaveBeenCalled();
      });

      vi.mocked(validateRecordValue).mockReturnValue(null);
    });
  });

  describe("delete functionality", () => {
    it("opens delete dialog when delete button is clicked", () => {
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId("delete-record"));
      expect(screen.getByText("Confirm action")).toBeInTheDocument();
      expect(
        screen.getByText("Do you really want to remove the Bio record?"),
      ).toBeInTheDocument();
    });

    it("closes delete dialog when No button is clicked", () => {
      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId("delete-record"));
      fireEvent.click(screen.getByText("No"));
      expect(screen.queryByText("Confirm action")).not.toBeInTheDocument();
    });

    it("calls repository.delete with correct class when confirmed", async () => {
      const mockIntent = createMockIntent();
      mockRepository.delete.mockResolvedValue(mockIntent);

      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId("delete-record"));
      fireEvent.click(screen.getByText("Yes"));

      await waitFor(() => {
        expect(mockRepository.delete).toHaveBeenCalledWith(0);
      });
    });

    it("calls onUpdate after successful delete", async () => {
      const mockIntent = createMockIntent();
      mockRepository.delete.mockResolvedValue(mockIntent);

      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId("delete-record"));
      fireEvent.click(screen.getByText("Yes"));

      await waitFor(() => {
        expect(defaultProps.onUpdate).toHaveBeenCalled();
      });
    });

    it("closes dialog after successful delete", async () => {
      const mockIntent = createMockIntent();
      mockRepository.delete.mockResolvedValue(mockIntent);

      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId("delete-record"));
      fireEvent.click(screen.getByText("Yes"));

      await waitFor(() => {
        expect(screen.queryByText("Confirm action")).not.toBeInTheDocument();
      });
    });

    it("shows toast with transaction link on delete", async () => {
      const { toast } = await import("sonner");
      const mockIntent = createMockIntent();
      mockRepository.delete.mockResolvedValue(mockIntent);

      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId("delete-record"));
      fireEvent.click(screen.getByText("Yes"));

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          "New Transaction submitted",
          expect.objectContaining({
            duration: 10000,
          }),
        );
      });
    });
  });

  describe("record values that lead somewhere", () => {
    it("links a URL record to the address it stores", () => {
      render(
        <Record {...defaultProps} type="Uri" value="https://example.com" />,
      );

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "https://example.com/");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    // Someone typing a domain into a URL field means the site, not a path on
    // this one — which is what a schemeless href would resolve to.
    it("reads a schemeless URL as a website, not a path on this site", () => {
      render(<Record {...defaultProps} type="Uri" value="example.com" />);

      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        "https://example.com/",
      );
    });

    it("opens a mail client for an email record", () => {
      render(<Record {...defaultProps} type="Email" value="a@b.com" />);

      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        "mailto:a@b.com",
      );
    });

    it("links a Twitter handle to the profile, with or without the @", () => {
      render(<Record {...defaultProps} type="Twitter" value="@metanames_" />);

      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        "https://x.com/metanames_",
      );
    });

    it("links a wallet record to the explorer", () => {
      const address = "00" + "a".repeat(40);
      render(<Record {...defaultProps} type="Wallet" value={address} />);

      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        `https://browser.testnet.partisiablockchain.com/accounts/${address}/assets`,
      );
    });

    it("leaves a value with nowhere to go as plain text", () => {
      render(<Record {...defaultProps} type="Bio" value="hello there" />);

      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      expect(screen.getByText("hello there")).toBeInTheDocument();
    });

    // A record is 64 characters of whatever its owner typed, so the page must
    // never turn one into a link that executes it.
    it("refuses to link a javascript: value", () => {
      render(
        <Record {...defaultProps} type="Uri" value="javascript:alert(1)" />,
      );

      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  // A reverted transaction resolves with `hasError: true` rather than
  // rejecting. Before these guards it flowed straight into the success toast,
  // so the user was told a record was written that the chain had thrown out.
  describe("failed transactions", () => {
    const revertedIntent = () => ({
      transactionHash: "mock-tx-hash",
      fetchResult: Promise.resolve({
        transactionHash: "mock-tx-hash",
        hasError: true,
        errorMessage: "out of gas",
      }),
    });

    beforeEach(() => {
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    it("does not claim success when an update reverts on chain", async () => {
      const { toast } = await import("sonner");
      mockRepository.update.mockResolvedValue(revertedIntent());

      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId("edit-record"));
      fireEvent.click(screen.getByTestId("save-record"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("out of gas");
      });
      expect(toast.success).not.toHaveBeenCalled();
      expect(defaultProps.onUpdate).not.toHaveBeenCalled();
      // Still in edit mode, so the value is not lost on a failed write.
      expect(screen.getByTestId("save-record")).toBeInTheDocument();
    });

    it("does not claim success when a delete reverts on chain", async () => {
      const { toast } = await import("sonner");
      mockRepository.delete.mockResolvedValue(revertedIntent());

      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId("delete-record"));
      fireEvent.click(screen.getByText("Yes"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("out of gas");
      });
      expect(toast.success).not.toHaveBeenCalled();
      expect(defaultProps.onUpdate).not.toHaveBeenCalled();
    });

    // A rejected delete used to escape as an unhandled rejection: no toast, no
    // Sentry event, and a dialog stuck on "Deleting...".
    it("reports a rejected delete instead of swallowing it", async () => {
      const { toast } = await import("sonner");
      const Sentry = await import("@sentry/nextjs");
      mockRepository.delete.mockRejectedValue(new Error("user rejected"));

      render(<Record {...defaultProps} />);
      fireEvent.click(screen.getByTestId("delete-record"));
      fireEvent.click(screen.getByText("Yes"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("user rejected");
      });
      expect(Sentry.captureException).toHaveBeenCalled();
      expect(screen.getByText("Yes")).not.toBeDisabled();
    });
  });

  describe("accessible labels", () => {
    it("names every icon-only action for screen readers", () => {
      render(<Record {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: "Edit Bio record" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Delete Bio record" }),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("edit-record"));
      expect(
        screen.getByRole("button", { name: "Save Bio record" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancel editing Bio record" }),
      ).toBeInTheDocument();
    });
  });
});

describe("Record classes the app cannot write", () => {
  // Avatar and Main exist on chain but are not in RECORD_CLASS_MAP, so a save
  // could only ever fail with "Unsupported record type" and a delete returned
  // without a word. Neither control is offered any more.
  it("offers no edit or delete for an unsupported class", () => {
    render(
      <Record
        type={"Avatar" as never}
        value="https://example.com/a.png"
        onUpdate={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("edit-record")).not.toBeInTheDocument();
    expect(screen.queryByTestId("delete-record")).not.toBeInTheDocument();
    expect(screen.getByTestId("record-read-only")).toBeInTheDocument();
  });

  it("still shows the stored value", () => {
    render(<Record type={"Main" as never} value="1" onUpdate={vi.fn()} />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("keeps edit and delete for a supported class", () => {
    render(<Record type="Bio" value="hello" onUpdate={vi.fn()} />);
    expect(screen.getByTestId("edit-record")).toBeInTheDocument();
    expect(screen.queryByTestId("record-read-only")).not.toBeInTheDocument();
  });
});
